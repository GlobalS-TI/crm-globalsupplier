import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from '@react-email/components'

interface Props {
  leadName:    string
  sectionName: string
  assignedBy:  string
  leadUrl:     string
}

export function LeadAssignedEmail({ leadName, sectionName, assignedBy, leadUrl }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', background: '#f9fafb', padding: '24px', margin: 0 }}>
        <Container style={{ maxWidth: '540px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Section style={{ background: '#1d4ed8', padding: '20px 24px' }}>
            <Heading as="h1" style={{ color: '#fff', margin: 0, fontSize: '18px' }}>
              CRM Global Supplier
            </Heading>
          </Section>
          <Section style={{ padding: '28px 24px' }}>
            <Heading as="h2" style={{ margin: '0 0 8px', fontSize: '16px', color: '#111827' }}>
              Se te asignó un lead
            </Heading>
            <Text style={{ margin: '0 0 20px', color: '#374151' }}>
              <strong>{assignedBy}</strong> te asignó el lead <strong>"{leadName}"</strong> en la sección <strong>{sectionName}</strong>.
            </Text>
            <Button
              href={leadUrl}
              style={{ background: '#1d4ed8', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
            >
              Ver lead
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
