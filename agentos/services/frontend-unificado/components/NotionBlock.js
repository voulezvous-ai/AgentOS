export default function NotionBlock({ title, content }) {
  return (
    <div className="bg-white text-black border border-gray-300 rounded-md p-5 shadow-sm hover:shadow-md transition duration-200 font-notion">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm mt-2">{content}</p>
    </div>
  )
}