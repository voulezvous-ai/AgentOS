export default function StripeCard({ title, content }) {
  return (
    <div className="bg-stripeBlue text-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 font-stripe">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/80">{content}</p>
    </div>
  )
}