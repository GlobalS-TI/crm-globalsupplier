import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from '@react-email/components'

interface Props {
  leadName:   string
  oppNombre:  string
  convertedBy: string
  oppUrl:     string
}

export function LeadConvertedEmail({ leadName, oppNombre, convertedBy, oppUrl }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', background: '#f9fafb', padding: '24px', margin: 0 }}>
        <Container style={{ maxWidth: '540px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Section style={{ background: '#7c3aed', padding: '20px 24px' }}>
            <Heading as="h1" style={{ color: '#fff', margin: 0, fontSize: '18px' }}>
              🚀 Lead convertido a oportunidad
            </Heading>
            <Text style={{ color: '#ddd6fe', margin: '4px 0 0', fontSize: '13px' }}>
              CRM Global Supplier
            </Text>
          </Section>
          <Section style={{ padding: '28px 24px' }}>
            <Text style={{ margin: '0 0 16px', color: '#374151' }}>
              <strong>{convertedBy}</strong> convirtió el lead <strong>"{leadName}"</strong> en una nueva oportunidad:
            </Text>
            <Heading as="h2" style={{ margin: '0 0 20px', fontSize: '18px', color: '#111827' }}>
              {oppNombre}
            </Heading>
            <Button
              href={oppUrl}
              style={{ background: '#7c3aed', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
            >
              Ver oportunidad
            </Button>
            <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
            <Text style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              CRM Global Supplier — notificación automática
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
