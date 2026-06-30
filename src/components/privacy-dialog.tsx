import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PrivacyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrivacyDialog({ open, onOpenChange }: PrivacyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Política de Privacidade</DialogTitle>
          <DialogDescription>Aplicativo BEM.ai</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* 1. INFORMAÇÕES GERAIS */}
            <section>
              <h3 className="text-lg font-semibold mb-3">1. INFORMAÇÕES GERAIS</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">1.1. Identificação do Controlador</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Esta Política de Privacidade ("Política") é aplicável ao aplicativo móvel BEM.ai ("Aplicativo"), desenvolvido e operado pela AAES SOLUÇÕES DIGITAIS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 48.569.146/0001-89 ("Empresa", "Controlador" ou "BEM.ai").
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">1.2. Compromisso com a Privacidade</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A Empresa está comprometida com a proteção da privacidade e dos dados pessoais de seus usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - "LGPD") e demais normativas aplicáveis.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">1.3. Aplicabilidade</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Esta Política aplica-se a todos os usuários do Aplicativo BEM.ai e descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos os dados pessoais.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">1.4. Definições</h4>
                <p className="text-muted-foreground mb-2">Para os fins desta Política, aplicam-se as definições previstas na LGPD, destacando-se:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong>Dados Pessoais:</strong> informação relacionada a pessoa natural identificada ou identificável;</li>
                  <li><strong>Dados Sensíveis:</strong> dados pessoais sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, dado genético ou biométrico;</li>
                  <li><strong>Titular:</strong> pessoa natural a quem se referem os dados pessoais;</li>
                  <li><strong>Tratamento:</strong> toda operação realizada com dados pessoais.</li>
                </ul>
              </div>
            </section>

            {/* 2. DADOS PESSOAIS COLETADOS */}
            <section>
              <h3 className="text-lg font-semibold mb-3">2. DADOS PESSOAIS COLETADOS</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2.1. Categorias de Dados</h4>
                <p className="text-muted-foreground mb-2">O BEM.ai coleta as seguintes categorias de dados pessoais:</p>

                <div className="space-y-3 mt-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">2.1.1. Dados de Identificação:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Nome completo;</li>
                      <li>Endereço de e-mail;</li>
                      <li>Data de nascimento/idade.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">2.1.2. Dados Corporais e Biométricos:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Peso atual e histórico;</li>
                      <li>Altura;</li>
                      <li>Índice de Massa Corporal (IMC);</li>
                      <li>Medidas corporais (quando fornecidas).</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">2.1.3. Dados de Saúde (Dados Sensíveis):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Hábitos alimentares;</li>
                      <li>Restrições alimentares e alergias;</li>
                      <li>Objetivos de saúde (emagrecimento, ganho de massa muscular);</li>
                      <li>Informações sobre uso de medicamentos emagrecedores/GLP-1;</li>
                      <li>Histórico de atividades físicas;</li>
                      <li>Padrões de sono (quando fornecidos);</li>
                      <li>Informações sobre jejum intermitente.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">2.1.4. Dados de Uso e Navegação:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Interações com o Aplicativo;</li>
                      <li>Funcionalidades utilizadas;</li>
                      <li>Tempo de uso;</li>
                      <li>Preferências de configuração;</li>
                      <li>Logs de acesso;</li>
                      <li>Informações do dispositivo (modelo, sistema operacional, versão do app).</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">2.1.5. Dados de Conteúdo:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Fotografias de alimentos (para rastreamento nutricional);</li>
                      <li>Registros de refeições;</li>
                      <li>Anotações pessoais sobre alimentação e exercícios.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2.2. Dados Não Coletados</h4>
                <p className="text-muted-foreground mb-2">O BEM.ai NÃO coleta:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Dados de localização em tempo real;</li>
                  <li>Contatos do dispositivo;</li>
                  <li>Informações de outras aplicações;</li>
                  <li>Dados bancários (processados por terceiros seguros).</li>
                </ul>
              </div>
            </section>

            {/* 3. FINALIDADES DO TRATAMENTO */}
            <section>
              <h3 className="text-lg font-semibold mb-3">3. FINALIDADES DO TRATAMENTO</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3.1. Bases Legais e Finalidades</h4>
                <p className="text-muted-foreground mb-2">Os dados pessoais são tratados com base nas seguintes hipóteses legais da LGPD:</p>

                <div className="space-y-3 mt-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">3.1.1. Execução de Contrato (Art. 7º, V):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Prestação dos serviços do Aplicativo;</li>
                      <li>Cálculo personalizado de IMC e necessidades nutricionais;</li>
                      <li>Geração de relatórios e acompanhamentos;</li>
                      <li>Processamento de pagamentos e renovações de assinatura.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">3.1.2. Consentimento (Art. 7º, I e Art. 11, I para dados sensíveis):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Personalização de recomendações nutricionais;</li>
                      <li>Ajustes para medicamentos emagrecedores;</li>
                      <li>Envio de notificações e lembretes;</li>
                      <li>Análise de fotografias para rastreamento nutricional.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">3.1.3. Legítimo Interesse (Art. 7º, IX):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Melhoria e desenvolvimento do Aplicativo;</li>
                      <li>Análises estatísticas e de uso (dados anonimizados);</li>
                      <li>Prevenção de fraudes e atividades maliciosas;</li>
                      <li>Suporte técnico e atendimento ao cliente.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">3.1.4. Cumprimento de Obrigação Legal (Art. 7º, II):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Atendimento a determinações judiciais;</li>
                      <li>Cumprimento de obrigações regulatórias;</li>
                      <li>Manutenção de registros contábeis e fiscais.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3.2. Finalidades Específicas dos Dados de Saúde</h4>
                <p className="text-muted-foreground mb-2">Os dados sensíveis relacionados à saúde são utilizados exclusivamente para:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Cálculo de necessidades calóricas e macronutrientes;</li>
                  <li>Recomendações alimentares personalizadas;</li>
                  <li>Ajustes nutricionais para usuários de medicamentos específicos;</li>
                  <li>Monitoramento de progresso em objetivos de saúde;</li>
                  <li>Orientações sobre jejum intermitente.</li>
                </ul>
              </div>
            </section>

            {/* 4. COMPARTILHAMENTO DE DADOS */}
            <section>
              <h3 className="text-lg font-semibold mb-3">4. COMPARTILHAMENTO DE DADOS</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.1. Princípio da Não Compartilhamento</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Como regra geral, o BEM.ai NÃO compartilha dados pessoais com terceiros, mantendo-os sob rigoroso controle e proteção.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.2. Hipóteses Excepcionais de Compartilhamento</h4>
                <p className="text-muted-foreground mb-2">Os dados pessoais poderão ser compartilhados apenas nas seguintes situações:</p>

                <div className="space-y-3 mt-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">4.2.1. Prestadores de Serviços Essenciais:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Provedores de infraestrutura em nuvem (armazenamento seguro);</li>
                      <li>Processadores de pagamento (dados mínimos necessários);</li>
                      <li>Serviços de envio de e-mail (comunicações autorizadas);</li>
                      <li>Fornecedores de análise de imagem (processamento local quando possível).</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">4.2.2. Determinações Legais:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Cumprimento de ordens judiciais;</li>
                      <li>Atendimento a requisições de autoridades competentes;</li>
                      <li>Cumprimento de obrigações legais e regulatórias.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">4.2.3. Proteção de Direitos:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Defesa em processos judiciais;</li>
                      <li>Investigação de fraudes ou violações dos Termos de Uso;</li>
                      <li>Proteção da segurança dos usuários e da Empresa.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.3. Garantias para Compartilhamento</h4>
                <p className="text-muted-foreground mb-2">Quando necessário o compartilhamento, a Empresa garante:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Contratos rigorosos de proteção de dados;</li>
                  <li>Compartilhamento de dados mínimos necessários;</li>
                  <li>Verificação das medidas de segurança dos terceiros;</li>
                  <li>Monitoramento contínuo do tratamento.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.4. Transferência Internacional</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Atualmente, o BEM.ai não realiza transferência internacional de dados. Caso venha a ocorrer, será implementada em conformidade com a LGPD e com notificação prévia aos usuários.
                </p>
              </div>
            </section>

            {/* 5. ARMAZENAMENTO E RETENÇÃO */}
            <section>
              <h3 className="text-lg font-semibold mb-3">5. ARMAZENAMENTO E RETENÇÃO</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5.1. Localização dos Dados</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Os dados pessoais são armazenados em servidores localizados no território brasileiro, em conformidade com a legislação nacional.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5.2. Períodos de Retenção</h4>

                <div className="space-y-3 mt-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">5.2.1. Dados de Usuários Ativos:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Mantidos durante toda a vigência da relação contratual;</li>
                      <li>Atualizados conforme interação do usuário com o Aplicativo.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">5.2.2. Dados Após Cancelamento:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Dados de identificação: 5 anos (obrigações fiscais e contratuais);</li>
                      <li>Dados de saúde: exclusão imediata, salvo consentimento específico para pesquisas anonimizadas;</li>
                      <li>Dados de uso: anonimização imediata para análises estatísticas.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">5.2.3. Dados para Cumprimento Legal:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Mantidos pelo prazo exigido pela legislação aplicável;</li>
                      <li>Exclusão automática após expiração dos prazos legais.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5.3. Exclusão de Dados</h4>
                <p className="text-muted-foreground leading-relaxed">
                  O usuário pode solicitar a exclusão de seus dados a qualquer momento, observadas as hipóteses de retenção legal obrigatória.
                </p>
              </div>
            </section>

            {/* 6. DIREITOS DOS TITULARES */}
            <section>
              <h3 className="text-lg font-semibold mb-3">6. DIREITOS DOS TITULARES</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6.1. Direitos Garantidos pela LGPD</h4>
                <p className="text-muted-foreground mb-2">Em conformidade com a LGPD, os usuários possuem os seguintes direitos:</p>

                <div className="space-y-3 mt-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">6.1.1. Confirmação e Acesso (Art. 18, I e II):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Confirmação da existência de tratamento;</li>
                      <li>Acesso aos dados pessoais tratados;</li>
                      <li>Informações sobre finalidades e compartilhamento.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">6.1.2. Correção e Atualização (Art. 18, III):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                      <li>Atualização de informações pessoais.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">6.1.3. Anonimização e Eliminação (Art. 18, IV e VI):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Anonimização de dados desnecessários;</li>
                      <li>Eliminação de dados tratados com base no consentimento;</li>
                      <li>Exclusão de dados excessivos ou desnecessários.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">6.1.4. Portabilidade (Art. 18, V):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Portabilidade dos dados a outro fornecedor;</li>
                      <li>Formato estruturado e interoperável.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">6.1.5. Informação sobre Compartilhamento (Art. 18, VII):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Informações sobre entidades com as quais dados foram compartilhados;</li>
                      <li>Finalidades do compartilhamento.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">6.1.6. Revogação do Consentimento (Art. 18, IX):</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Revogação do consentimento a qualquer momento;</li>
                      <li>Manutenção do tratamento quando baseado em outras hipóteses legais.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6.2. Exercício dos Direitos</h4>
                <p className="text-muted-foreground mb-2">Para exercer seus direitos, o usuário pode:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Utilizar as funcionalidades disponíveis no próprio Aplicativo;</li>
                  <li>Entrar em contato através dos canais oficiais;</li>
                  <li>Enviar solicitação por escrito com identificação adequada.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6.3. Prazos para Atendimento</h4>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Confirmação de recebimento: imediato;</li>
                  <li>Resposta às solicitações: até 15 dias corridos;</li>
                  <li>Implementação das solicitações: prazo adicional razoável quando necessário.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6.4. Gratuidade</h4>
                <p className="text-muted-foreground leading-relaxed">
                  O exercício dos direitos é gratuito, podendo ser cobrada taxa apenas em caso de solicitações manifestamente infundadas ou excessivas.
                </p>
              </div>
            </section>

            {/* 7. COOKIES E TECNOLOGIAS SIMILARES */}
            <section>
              <h3 className="text-lg font-semibold mb-3">7. COOKIES E TECNOLOGIAS SIMILARES</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">7.1. Uso de Cookies</h4>
                <p className="text-muted-foreground mb-2">O BEM.ai utiliza cookies e tecnologias similares para:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Manter sessões de usuário ativas;</li>
                  <li>Lembrar preferências de configuração;</li>
                  <li>Melhorar a experiência de uso;</li>
                  <li>Realizar análises de performance.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">7.2. Tipos de Cookies</h4>

                <div className="space-y-3 mt-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">7.2.1. Cookies Essenciais:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Necessários para funcionamento básico;</li>
                      <li>Não podem ser desabilitados;</li>
                      <li>Não requerem consentimento.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">7.2.2. Cookies de Funcionalidade:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Melhoram a experiência do usuário;</li>
                      <li>Podem ser desabilitados nas configurações;</li>
                      <li>Baseados em legítimo interesse.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">7.2.3. Cookies Analíticos:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Dados anonimizados sobre uso;</li>
                      <li>Podem ser desabilitados;</li>
                      <li>Requerem consentimento específico.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">7.3. Gerenciamento de Cookies</h4>
                <p className="text-muted-foreground mb-2">O usuário pode gerenciar cookies através de:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Configurações do próprio Aplicativo;</li>
                  <li>Configurações do navegador/dispositivo;</li>
                  <li>Ferramentas de opt-out específicas.</li>
                </ul>
              </div>
            </section>

            {/* 8. MENORES DE IDADE */}
            <section>
              <h3 className="text-lg font-semibold mb-3">8. MENORES DE IDADE</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">8.1. Restrição de Idade</h4>
                <p className="text-muted-foreground leading-relaxed">
                  O BEM.ai é destinado exclusivamente a usuários maiores de 18 anos. Não coletamos intencionalmente dados de menores de idade.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">8.2. Procedimentos de Verificação</h4>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Declaração de maioridade no cadastro;</li>
                  <li>Monitoramento para identificação de possíveis menores;</li>
                  <li>Exclusão imediata de contas de menores identificados.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">8.3. Responsabilidade dos Responsáveis</h4>
                <p className="text-muted-foreground mb-2">Caso um menor acesse o Aplicativo:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Os responsáveis legais devem comunicar imediatamente;</li>
                  <li>Procederemos à exclusão imediata da conta e dados;</li>
                  <li>Implementaremos medidas adicionais de prevenção.</li>
                </ul>
              </div>
            </section>

            {/* 9. ALTERAÇÕES NA POLÍTICA */}
            <section>
              <h3 className="text-lg font-semibold mb-3">9. ALTERAÇÕES NA POLÍTICA</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.1. Direito de Alteração</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A Empresa reserva-se o direito de alterar esta Política de Privacidade a qualquer tempo, em conformidade com a evolução legislativa e das práticas de mercado.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.2. Procedimento de Alteração</h4>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Notificação prévia de 30 dias aos usuários;</li>
                  <li>Comunicação através do Aplicativo e por e-mail;</li>
                  <li>Destaque para alterações substanciais;</li>
                  <li>Oportunidade de cancelamento sem ônus.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.3. Vigência das Alterações</h4>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Alterações entram em vigor após o prazo de notificação;</li>
                  <li>Continuidade do uso implica aceitação das alterações;</li>
                  <li>Usuários podem cancelar a conta se discordarem.</li>
                </ul>
              </div>
            </section>

            {/* 10. AUTORIDADE DE CONTROLE */}
            <section>
              <h3 className="text-lg font-semibold mb-3">10. AUTORIDADE DE CONTROLE</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">10.1. Autoridade Nacional de Proteção de Dados (ANPD)</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A ANPD é a autoridade competente para fiscalizar o cumprimento da LGPD no Brasil.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">10.2. Direito de Reclamação</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Os usuários têm o direito de apresentar reclamação à ANPD sobre o tratamento de seus dados pessoais.
                </p>
              </div>
            </section>

            {/* 11. DISPOSIÇÕES FINAIS */}
            <section>
              <h3 className="text-lg font-semibold mb-3">11. DISPOSIÇÕES FINAIS</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">11.1. Legislação Aplicável</h4>
                <p className="text-muted-foreground mb-2">Esta Política é regida pela legislação brasileira, especialmente:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Lei Geral de Proteção de Dados (Lei 13.709/2018);</li>
                  <li>Marco Civil da Internet (Lei 12.965/2014);</li>
                  <li>Código de Defesa do Consumidor (Lei 8.078/1990);</li>
                  <li>Constituição Federal de 1988.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">11.2. Foro Competente</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Fica eleito o foro da comarca do domicílio da Empresa para dirimir questões oriundas desta Política.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">11.3. Independência das Cláusulas</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A eventual invalidade de qualquer disposição não afetará a validade das demais cláusulas desta Política.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">11.4. Idioma</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Esta Política foi redigida em português brasileiro, sendo esta a versão oficial e prevalente.
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
