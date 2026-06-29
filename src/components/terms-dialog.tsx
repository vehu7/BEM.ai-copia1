import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Termos de Uso e Condições Gerais</DialogTitle>
          <DialogDescription>Aplicativo Bem.AI</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* 1. DISPOSIÇÕES PRELIMINARES */}
            <section>
              <h3 className="text-lg font-semibold mb-3">1. DISPOSIÇÕES PRELIMINARES</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">1.1. Objeto</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Os presentes Termos de Uso e Condições Gerais ("Termos") regulam a utilização do aplicativo móvel Bem.AI ("Aplicativo"), desenvolvido e operado pela AAES SOLUÇÕES DIGITAIS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 48.569.146/0001-89 ("Empresa" ou "Bem.AI").
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">1.2. Definições</h4>
                <p className="text-muted-foreground mb-2">Para os fins destes Termos, consideram-se as seguintes definições:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong>Usuário:</strong> pessoa física, maior de 18 anos, que utiliza o Aplicativo;</li>
                  <li><strong>Serviços:</strong> funcionalidades oferecidas pelo Aplicativo, incluindo rastreamento nutricional, cálculo de IMC, monitoramento de ingestão de água, planejamento de macronutrientes, contador de calorias, orientações alimentares, jejum intermitente e programa de meditação;</li>
                  <li><strong>Assinatura:</strong> modalidade de contratação dos Serviços mediante pagamento recorrente;</li>
                  <li><strong>Conta:</strong> perfil individual do Usuário no Aplicativo.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">1.3. Aceitação dos Termos</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A utilização do Aplicativo implica na aceitação integral e incondicional destes Termos. Caso não concorde com qualquer disposição, o Usuário deve cessar imediatamente o uso do Aplicativo.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">1.4. Alterações</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A Empresa reserva-se o direito de modificar estes Termos a qualquer tempo, mediante notificação prévia de 30 (trinta) dias aos Usuários, através do próprio Aplicativo ou por e-mail. A continuidade do uso após a vigência das alterações constituirá aceitação tácita dos novos termos.
                </p>
              </div>
            </section>

            {/* 2. DESCRIÇÃO DOS SERVIÇOS */}
            <section>
              <h3 className="text-lg font-semibold mb-3">2. DESCRIÇÃO DOS SERVIÇOS</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2.1. Funcionalidades</h4>
                <p className="text-muted-foreground mb-2">O Bem.AI oferece as seguintes funcionalidades:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Rastreamento nutricional por meio de fotografias;</li>
                  <li>Cálculo e monitoramento do Índice de Massa Corporal (IMC);</li>
                  <li>Controle de ingestão diária de água;</li>
                  <li>Planejamento personalizado de macronutrientes;</li>
                  <li>Ajustes nutricionais para usuários de medicamentos emagrecedores/GLP-1;</li>
                  <li>Contador de calorias;</li>
                  <li>Lista de alimentos recomendados;</li>
                  <li>Orientações sobre jejum intermitente;</li>
                  <li>Programa de meditação.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2.2. Natureza dos Serviços</h4>
                <p className="text-muted-foreground leading-relaxed">
                  O Aplicativo oferece ferramentas de monitoramento e orientação geral para hábitos saudáveis. NÃO constitui aconselhamento médico, nutricional ou terapêutico profissional.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2.3. Limitações</h4>
                <p className="text-muted-foreground mb-2">Os Serviços destinam-se exclusivamente a:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Adultos maiores de 18 anos;</li>
                  <li>Residentes no território brasileiro;</li>
                  <li>Fins de acompanhamento pessoal e educacional.</li>
                </ul>
              </div>
            </section>

            {/* 3. CADASTRO E RESPONSABILIDADES */}
            <section>
              <h3 className="text-lg font-semibold mb-3">3. CADASTRO E RESPONSABILIDADES DO USUÁRIO</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3.1. Requisitos para Cadastro</h4>
                <p className="text-muted-foreground mb-2">Para utilizar o Aplicativo, o Usuário deve:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Ser maior de 18 anos;</li>
                  <li>Fornecer informações verdadeiras, precisas e atualizadas;</li>
                  <li>Manter a confidencialidade de suas credenciais de acesso;</li>
                  <li>Utilizar o Aplicativo em conformidade com estes Termos e a legislação vigente.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3.2. Responsabilidades do Usuário</h4>
                <p className="text-muted-foreground mb-2">O Usuário compromete-se a:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Utilizar o Aplicativo exclusivamente para fins lícitos;</li>
                  <li>Não compartilhar sua conta com terceiros;</li>
                  <li>Comunicar imediatamente qualquer uso não autorizado de sua conta;</li>
                  <li>Manter seus dados de cadastro atualizados;</li>
                  <li>Não tentar burlar sistemas de segurança ou acessar áreas restritas;</li>
                  <li>Não utilizar o Aplicativo para fins comerciais não autorizados.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3.3. Proibições</h4>
                <p className="text-muted-foreground mb-2">É expressamente vedado ao Usuário:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Fazer engenharia reversa, descompilar ou desmontar o Aplicativo;</li>
                  <li>Utilizar robôs, scripts ou outros meios automatizados;</li>
                  <li>Transmitir vírus, malware ou códigos maliciosos;</li>
                  <li>Violar direitos de propriedade intelectual;</li>
                  <li>Utilizar o Aplicativo para atividades ilegais ou prejudiciais.</li>
                </ul>
              </div>
            </section>

            {/* 4. ASSINATURA E CONDIÇÕES COMERCIAIS */}
            <section>
              <h3 className="text-lg font-semibold mb-3">4. ASSINATURA E CONDIÇÕES COMERCIAIS</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.1. Modalidades de Assinatura</h4>
                <p className="text-muted-foreground mb-2">O Aplicativo oferece as seguintes modalidades:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Período de Teste Gratuito: 7 (sete) dias;</li>
                  <li>Assinatura Mensal: renovação automática a cada 30 dias;</li>
                  <li>Assinatura Anual: renovação automática a cada 12 meses.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.2. Período de Teste Gratuito</h4>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Duração de 7 (sete) dias corridos;</li>
                  <li>Acesso completo às funcionalidades;</li>
                  <li>Cancelamento sem cobrança se efetuado antes do término do período;</li>
                  <li>Conversão automática em assinatura paga ao final, salvo cancelamento prévio.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.3. Formas de Pagamento</h4>
                <p className="text-muted-foreground mb-2">São aceitas as seguintes formas de pagamento:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>PIX;</li>
                  <li>Cartão de crédito (renovação automática).</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.4. Cobrança e Renovação</h4>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>A primeira cobrança ocorre ao final do período de teste gratuito;</li>
                  <li>As renovações são automáticas, conforme modalidade escolhida;</li>
                  <li>O Usuário será notificado com antecedência sobre as renovações;</li>
                  <li>Os valores podem ser reajustados mediante notificação prévia de 30 dias.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.5. Política de Cancelamento</h4>
                <p className="text-muted-foreground mb-2"><strong>Assinatura Mensal:</strong></p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-3">
                  <li>Cancelamento a qualquer momento através do Aplicativo;</li>
                  <li>Acesso mantido até o final do período já pago;</li>
                  <li>Sem cobrança de multa ou taxa de cancelamento.</li>
                </ul>
                <p className="text-muted-foreground mb-2"><strong>Assinatura Anual:</strong></p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Cancelamento a qualquer momento através do Aplicativo;</li>
                  <li>Acesso mantido até o final do período anual já pago;</li>
                  <li>Sem reembolso proporcional do valor pago;</li>
                  <li>Sem cobrança de multa ou taxa de cancelamento.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4.6. Política de Reembolso</h4>
                <p className="text-muted-foreground mb-2">Em conformidade com o Código de Defesa do Consumidor:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Cancelamento em até 7 dias da contratação: reembolso integral;</li>
                  <li>Problemas técnicos impeditivos do uso: reembolso proporcional;</li>
                  <li>Reembolsos processados em até 10 dias úteis.</li>
                </ul>
              </div>
            </section>

            {/* 5. PROTEÇÃO DE DADOS */}
            <section>
              <h3 className="text-lg font-semibold mb-3">5. PROTEÇÃO DE DADOS E PRIVACIDADE</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5.1. Dados Coletados</h4>
                <p className="text-muted-foreground mb-2">O Aplicativo coleta os seguintes dados pessoais:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Dados de identificação: nome e e-mail;</li>
                  <li>Dados corporais: idade, peso e altura;</li>
                  <li>Dados de saúde: hábitos alimentares e informações de saúde geral;</li>
                  <li>Dados de uso: interações com o Aplicativo.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5.2. Finalidades do Tratamento</h4>
                <p className="text-muted-foreground mb-2">Os dados são utilizados para:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Prestação e personalização dos Serviços;</li>
                  <li>Cálculos de IMC e recomendações nutricionais;</li>
                  <li>Comunicação com o Usuário;</li>
                  <li>Melhoria dos Serviços;</li>
                  <li>Cumprimento de obrigações legais.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5.3. Compartilhamento de Dados</h4>
                <p className="text-muted-foreground mb-2">Os dados pessoais não são compartilhados com terceiros, exceto:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Quando exigido por lei ou ordem judicial;</li>
                  <li>Para prestadores de serviços essenciais (sob rigoroso controle);</li>
                  <li>Com consentimento expresso do Usuário.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5.4. Direitos do Titular</h4>
                <p className="text-muted-foreground mb-2">O Usuário possui os direitos previstos na LGPD, incluindo:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Confirmação da existência de tratamento;</li>
                  <li>Acesso aos dados;</li>
                  <li>Correção de dados incompletos ou inexatos;</li>
                  <li>Anonimização, bloqueio ou eliminação;</li>
                  <li>Portabilidade dos dados;</li>
                  <li>Revogação do consentimento.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5.5. Segurança</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A Empresa adota medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acessos não autorizados e situações de destruição, perda, alteração, comunicação ou difusão.
                </p>
              </div>
            </section>

            {/* 6. PROPRIEDADE INTELECTUAL */}
            <section>
              <h3 className="text-lg font-semibold mb-3">6. PROPRIEDADE INTELECTUAL</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6.1. Direitos da Empresa</h4>
                <p className="text-muted-foreground mb-2">Todos os direitos de propriedade intelectual sobre o Aplicativo, incluindo mas não limitado a:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Código-fonte e algoritmos;</li>
                  <li>Interface gráfica e design;</li>
                  <li>Textos, imagens e conteúdos;</li>
                  <li>Marcas e logotipos;</li>
                  <li>Metodologias e processos;</li>
                </ul>
                <p className="text-muted-foreground mt-2">São de propriedade exclusiva da Empresa ou de seus licenciadores.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6.2. Licença de Uso</h4>
                <p className="text-muted-foreground leading-relaxed">
                  É concedida ao Usuário licença limitada, não exclusiva, intransferível e revogável para uso pessoal do Aplicativo, conforme estes Termos.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6.3. Restrições</h4>
                <p className="text-muted-foreground mb-2">O Usuário não pode:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Reproduzir, distribuir ou modificar o Aplicativo;</li>
                  <li>Criar obras derivadas;</li>
                  <li>Fazer engenharia reversa;</li>
                  <li>Remover avisos de propriedade intelectual.</li>
                </ul>
              </div>
            </section>

            {/* 7. LIMITAÇÕES DE RESPONSABILIDADE */}
            <section>
              <h3 className="text-lg font-semibold mb-3">7. LIMITAÇÕES DE RESPONSABILIDADE</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">7.1. Natureza dos Serviços</h4>
                <p className="text-muted-foreground mb-2">O Usuário reconhece e concorda que:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>O Aplicativo oferece orientações gerais, não substituindo aconselhamento médico profissional;</li>
                  <li>Qualquer decisão relacionada à saúde deve ser tomada com orientação médica adequada;</li>
                  <li>A Empresa não se responsabiliza por resultados específicos de perda de peso ou ganho de massa muscular.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">7.2. Limitações Gerais</h4>
                <p className="text-muted-foreground mb-2">A responsabilidade da Empresa está limitada a:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Prestação dos Serviços conforme descritos;</li>
                  <li>Valor pago pelo Usuário nos últimos 12 meses;</li>
                  <li>Danos diretos comprovadamente causados por dolo ou culpa grave.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">7.3. Exclusões</h4>
                <p className="text-muted-foreground mb-2">A Empresa não se responsabiliza por:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Decisões tomadas com base nas informações do Aplicativo;</li>
                  <li>Problemas de saúde decorrentes do uso inadequado;</li>
                  <li>Falhas de conectividade ou problemas técnicos de terceiros;</li>
                  <li>Perda de dados por motivos alheios ao controle da Empresa.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">7.4. Disponibilidade</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A Empresa envidará melhores esforços para manter o Aplicativo disponível, mas não garante funcionamento ininterrupto, podendo realizar manutenções programadas mediante aviso prévio.
                </p>
              </div>
            </section>

            {/* 8. VIOLAÇÕES E SANÇÕES */}
            <section>
              <h3 className="text-lg font-semibold mb-3">8. VIOLAÇÕES E SANÇÕES</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">8.1. Violações</h4>
                <p className="text-muted-foreground mb-2">Constituem violações destes Termos:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Fornecimento de informações falsas;</li>
                  <li>Uso inadequado ou abusivo do Aplicativo;</li>
                  <li>Tentativa de burlar sistemas de segurança;</li>
                  <li>Violação de direitos de propriedade intelectual;</li>
                  <li>Qualquer conduta que prejudique outros Usuários ou a Empresa.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">8.2. Sanções</h4>
                <p className="text-muted-foreground mb-2">Em caso de violação, a Empresa pode:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Emitir advertência;</li>
                  <li>Suspender temporariamente a conta;</li>
                  <li>Cancelar definitivamente a conta;</li>
                  <li>Buscar reparação por danos causados.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">8.3. Processo</h4>
                <p className="text-muted-foreground mb-2">As sanções serão aplicadas mediante:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Notificação prévia, quando possível;</li>
                  <li>Oportunidade de defesa, exceto em casos graves;</li>
                  <li>Proporcionalidade entre a violação e a sanção.</li>
                </ul>
              </div>
            </section>

            {/* 9. DISPOSIÇÕES FINAIS */}
            <section>
              <h3 className="text-lg font-semibold mb-3">9. DISPOSIÇÕES FINAIS</h3>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.1. Legislação Aplicável</h4>
                <p className="text-muted-foreground mb-2">Estes Termos são regidos pela legislação brasileira, especialmente:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Código de Defesa do Consumidor (Lei 8.078/1990);</li>
                  <li>Marco Civil da Internet (Lei 12.965/2014);</li>
                  <li>Lei Geral de Proteção de Dados (Lei 13.709/2018);</li>
                  <li>Código Civil Brasileiro (Lei 10.406/2002).</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.2. Foro</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Fica eleito o foro da comarca do domicílio da Empresa para dirimir questões oriundas destes Termos, renunciando a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.3. Independência das Cláusulas</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A eventual nulidade ou inexequibilidade de qualquer disposição destes Termos não afetará a validade e eficácia das demais cláusulas.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.4. Integralidade</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Estes Termos constituem o acordo integral entre as partes, substituindo qualquer acordo anterior sobre o mesmo objeto.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.5. Cessão</h4>
                <p className="text-muted-foreground leading-relaxed">
                  O Usuário não pode ceder ou transferir seus direitos e obrigações sem autorização prévia e escrita da Empresa.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.6. Contato</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Para questões relacionadas a estes Termos, o Usuário pode entrar em contato através dos canais oficiais disponibilizados no Aplicativo.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9.7. Vigência</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Estes Termos entram em vigor na data de sua aceitação pelo Usuário e permanecem válidos enquanto durar a relação contratual.
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
