const request = require("supertest");

describe("Healthcheck do Frontend", () => {
    it("Deve responder com 200 em /", async () => {
        const res = await request("http://localhost").get("/");
        expect(res.statusCode).toBe(200);
    });
});