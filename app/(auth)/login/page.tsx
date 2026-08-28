import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/crm/LoginForm'

export const metadata = { title: 'Ingresar | Supply' }

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Image src="/logo.png" alt="" width={48} height={48} className="rounded-md mb-1" />
        <CardTitle>Supply</CardTitle>
        <CardDescription>Ingresa con tu cuenta corporativa</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
