import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/crm/LoginForm'

export const metadata = { title: 'Ingresar — CRM Global Supplier' }

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>CRM Global Supplier</CardTitle>
        <CardDescription>Ingresa con tu cuenta corporativa</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
