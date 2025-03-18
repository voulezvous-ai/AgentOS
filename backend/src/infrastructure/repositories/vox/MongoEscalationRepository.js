/**
 * Implementação do repositório de escalações usando MongoDB
 * Implementa a interface definida em domain/vox/repositories/EscalationRepository.js
 */
const { InfrastructureError, NotFoundError } = require('../../../domain/core/exceptions');
const EscalationFactory = require('../../../domain/vox/factories/EscalationFactory');

class MongoEscalationRepository {
  /**
   * @param {import('mongodb').Collection} escalationCollection Coleção MongoDB para escalações
   */
  constructor(escalationCollection) {
    this.collection = escalationCollection;
  }

  /**
   * Cria uma nova escalação no banco de dados
   * @param {Object} escalation Objeto escalação
   * @returns {Promise<Object>} Escalação criada
   */
  async create(escalation) {
    try {
      // Preparar objeto para persistência
      const escalationToSave = {
        ...escalation,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Inserir no banco de dados
      const result = await this.collection.insertOne(escalationToSave);
      
      // Verificar se a inserção foi bem-sucedida
      if (!result.acknowledged || !result.insertedId) {
        throw new InfrastructureError(
          'Falha ao criar escalação no banco de dados',
          'DB_INSERT_FAILED'
        );
      }
      
      // Retornar objeto completo
      return { ...escalationToSave, id: result.insertedId.toString() };
    } catch (error) {
      // Repassar erros específicos do domínio
      if (error.name === 'DomainError' || error.name === 'InfrastructureError') {
        throw error;
      }
      
      // Tratar outros erros como problemas de infraestrutura
      throw new InfrastructureError(
        `Erro ao criar escalação: ${error.message}`,
        'ESCALATION_CREATE_ERROR',
        error
      );
    }
  }

  /**
   * Atualiza uma escalação existente
   * @param {string} id ID da escalação
   * @param {Object} updates Atualizações a serem aplicadas
   * @returns {Promise<Object>} Escalação atualizada
   */
  async update(id, updates) {
    try {
      // Verificar se a escalação existe
      const existingEscalation = await this.findById(id);
      if (!existingEscalation) {
        throw new NotFoundError('Escalação não encontrada', 'escalation');
      }
      
      // Preparar objeto para atualização
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      // Atualizar no banco de dados
      const result = await this.collection.updateOne(
        { _id: this._convertToObjectId(id) },
        { $set: updateData }
      );
      
      // Verificar se a atualização foi bem-sucedida
      if (!result.acknowledged || result.matchedCount === 0) {
        throw new InfrastructureError(
          'Falha ao atualizar escalação no banco de dados',
          'DB_UPDATE_FAILED'
        );
      }
      
      // Retornar objeto atualizado
      return await this.findById(id);
    } catch (error) {
      // Repassar erros específicos do domínio
      if (error.name === 'DomainError' || 
          error.name === 'InfrastructureError' ||
          error.name === 'NotFoundError') {
        throw error;
      }
      
      // Tratar outros erros como problemas de infraestrutura
      throw new InfrastructureError(
        `Erro ao atualizar escalação: ${error.message}`,
        'ESCALATION_UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Busca uma escalação pelo ID
   * @param {string} id ID da escalação
   * @returns {Promise<Object|null>} Escalação encontrada ou null
   */
  async findById(id) {
    try {
      // Buscar no banco de dados
      const escalation = await this.collection.findOne({ 
        _id: this._convertToObjectId(id) 
      });
      
      // Retornar null se não encontrada
      if (!escalation) {
        return null;
      }
      
      // Converter _id para id e retornar
      return EscalationFactory.createFromDatabase({
        ...escalation,
        id: escalation._id.toString()
      });
    } catch (error) {
      throw new InfrastructureError(
        `Erro ao buscar escalação: ${error.message}`,
        'ESCALATION_FIND_ERROR',
        error
      );
    }
  }

  /**
   * Busca escalações pelo status
   * @param {string} status Status das escalações (pending, approved, rejected, canceled)
   * @param {Object} options Opções de paginação e ordenação
   * @returns {Promise<Array<Object>>} Lista de escalações
   */
  async findByStatus(status, options = {}) {
    try {
      // Configurar opções de paginação e ordenação
      const { limit, page, sort, sortDirection } = this._configureOptions(options);
      
      // Buscar no banco de dados
      const query = { status };
      
      // Adicionar filtros opcionais se fornecidos
      if (options.priority) {
        query.priority = options.priority;
      }
      
      if (options.after) {
        query.createdAt = { $gte: options.after };
      }
      
      if (options.before) {
        if (query.createdAt) {
          query.createdAt.$lte = options.before;
        } else {
          query.createdAt = { $lte: options.before };
        }
      }
      
      // Executar consulta
      const escalations = await this.collection.find(query)
        .sort({ [sort]: sortDirection === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      
      // Converter _id para id e retornar
      return escalations.map(escalation => 
        EscalationFactory.createFromDatabase({
          ...escalation,
          id: escalation._id.toString()
        })
      );
    } catch (error) {
      throw new InfrastructureError(
        `Erro ao buscar escalações por status: ${error.message}`,
        'ESCALATION_QUERY_ERROR',
        error
      );
    }
  }

  /**
   * Busca escalações pendentes para um aprovador
   * @param {string} approverId ID do aprovador
   * @param {Object} options Opções de paginação e ordenação
   * @returns {Promise<Array<Object>>} Lista de escalações
   */
  async findPendingForApprover(approverId, options = {}) {
    try {
      // Configurar opções de paginação e ordenação
      const { limit, page, sort, sortDirection } = this._configureOptions(options);
      
      // Buscar no banco de dados
      const query = { 
        status: 'pending',
        approvers: approverId
      };
      
      // Adicionar filtros opcionais
      if (options.priority) {
        query.priority = options.priority;
      }
      
      // Executar consulta
      const escalations = await this.collection.find(query)
        .sort({ [sort]: sortDirection === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      
      // Converter _id para id e retornar
      return escalations.map(escalation => 
        EscalationFactory.createFromDatabase({
          ...escalation,
          id: escalation._id.toString()
        })
      );
    } catch (error) {
      throw new InfrastructureError(
        `Erro ao buscar escalações para aprovador: ${error.message}`,
        'ESCALATION_QUERY_ERROR',
        error
      );
    }
  }

  /**
   * Busca escalações pendentes por departamento
   * @param {string} department Departamento
   * @param {Object} options Opções de paginação e ordenação
   * @returns {Promise<Array<Object>>} Lista de escalações
   */
  async findPendingByDepartment(department, options = {}) {
    try {
      // Configurar opções de paginação e ordenação
      const { limit, page, sort, sortDirection } = this._configureOptions(options);
      
      // Buscar no banco de dados
      const query = { 
        status: 'pending',
        department
      };
      
      // Adicionar filtros opcionais
      if (options.priority) {
        query.priority = options.priority;
      }
      
      // Executar consulta
      const escalations = await this.collection.find(query)
        .sort({ [sort]: sortDirection === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      
      // Converter _id para id e retornar
      return escalations.map(escalation => 
        EscalationFactory.createFromDatabase({
          ...escalation,
          id: escalation._id.toString()
        })
      );
    } catch (error) {
      throw new InfrastructureError(
        `Erro ao buscar escalações para departamento: ${error.message}`,
        'ESCALATION_QUERY_ERROR',
        error
      );
    }
  }

  /**
   * Busca escalações por usuário
   * @param {string} userId ID do usuário
   * @param {Object} options Opções de paginação e ordenação
   * @returns {Promise<Array<Object>>} Lista de escalações
   */
  async findByUser(userId, options = {}) {
    try {
      // Configurar opções de paginação e ordenação
      const { limit, page, sort, sortDirection } = this._configureOptions(options);
      
      // Buscar no banco de dados
      const query = { userId };
      
      // Adicionar filtros opcionais
      if (options.status) {
        query.status = options.status;
      }
      
      // Executar consulta
      const escalations = await this.collection.find(query)
        .sort({ [sort]: sortDirection === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      
      // Converter _id para id e retornar
      return escalations.map(escalation => 
        EscalationFactory.createFromDatabase({
          ...escalation,
          id: escalation._id.toString()
        })
      );
    } catch (error) {
      throw new InfrastructureError(
        `Erro ao buscar escalações para usuário: ${error.message}`,
        'ESCALATION_QUERY_ERROR',
        error
      );
    }
  }

  /**
   * Remove uma escalação pelo ID
   * @param {string} id ID da escalação
   * @returns {Promise<boolean>} true se removida com sucesso
   */
  async remove(id) {
    try {
      // Remover do banco de dados
      const result = await this.collection.deleteOne({ 
        _id: this._convertToObjectId(id) 
      });
      
      // Verificar se a remoção foi bem-sucedida
      return result.acknowledged && result.deletedCount > 0;
    } catch (error) {
      throw new InfrastructureError(
        `Erro ao remover escalação: ${error.message}`,
        'ESCALATION_REMOVE_ERROR',
        error
      );
    }
  }

  /**
   * Converte string ID para ObjectId do MongoDB
   * @private
   * @param {string} id ID da escalação
   * @returns {Object} ObjectId
   */
  _convertToObjectId(id) {
    try {
      const { ObjectId } = require('mongodb');
      return new ObjectId(id);
    } catch (error) {
      throw new InfrastructureError(
        `ID inválido: ${id}`,
        'INVALID_ID_FORMAT'
      );
    }
  }

  /**
   * Configura opções de paginação e ordenação
   * @private
   * @param {Object} options Opções fornecidas
   * @returns {Object} Opções configuradas
   */
  _configureOptions(options = {}) {
    return {
      limit: options.limit || 20,
      page: options.page || 1,
      sort: options.sort || 'createdAt',
      sortDirection: options.sortDirection || 'desc'
    };
  }
}

module.exports = MongoEscalationRepository;
