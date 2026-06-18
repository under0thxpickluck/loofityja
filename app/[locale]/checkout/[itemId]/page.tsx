import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; itemId: string }>
}) {
  const { itemId } = await params

  return <CheckoutClient itemId={itemId} />
}
