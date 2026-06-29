import { Html, Head, Body, Container, Section, Heading, Text, Row, Column, Hr } from '@react-email/components'

interface Props {
  opps: { nombre: string; owner: string; etapa: string }[]
}

export function StaleDigestEmail({ opps }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', background: '#f9fafb', padding: '24px', margin: 0 }}>
        <Container style={{ maxWidth: '600px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Section style={{ background: '#1d4ed8', padding: '20px 24px' }}>
            <Heading as="h1" style={{ color: '#fff', margin: 0, fontSize: '18px' }}>
              CRM Global Supplier
            </Heading>
            <Text style={{ color: '#bfdbfe', margin: '4px 0 0', fontSize: '13px' }}>
              Resumen de oportunidades sin actividad
            </Text>
          </Section>
          <Section style={{ padding: '24px' }}>
            <Text style={{ marginTop: 0 }}>
              Las siguientes <strong>{opps.length}</strong> oportunidades llevan más de 7 días sin actividad:
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <Row style={{ background: '#f3f4f6' }}>
                  <Column style={{ padding: '8px 12px', fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Oportunidad</Column>
                  <Column style={{ padding: '8px 12px', fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Vendedor</Column>
                  <Column style={{ padding: '8px 12px', fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Etapa</Column>
                </Row>
              </thead>
              <tbody>
                {opps.map((o, i) => (
                  <Row key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <Column style={{ padding: '8px 12px' }}>{o.nombre}</Column>
                    <Column style={{ padding: '8px 12px' }}>{o.owner}</Column>
                    <Column style={{ padding: '8px 12px', textTransform: 'capitalize' }}>{o.etapa.replace(/_/g, ' ')}</Column>
                  </Row>
                ))}
              </tbody>
            </table>
            <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0 12px' }} />
            <Text style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Entra al CRM para dar seguimiento a estas oportunidades.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
