import { Link } from 'react-router-dom';
import { Sparkles, Youtube, Instagram, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="glass border-t border-white/5 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">
                ASMR Luna
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              Sua fonte de relaxamento e bem-estar. Conteúdo ASMR de qualidade para ajudar você a relaxar, dormir melhor e encontrar paz.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              <a
                href="#"
                className="w-10 h-10 rounded-lg glass-hover flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg glass-hover flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg glass-hover flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/ideas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ideias de Vídeos
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Assinaturas
                </Link>
              </li>
              <li>
                <Link to="/vip" className="text-muted-foreground hover:text-foreground transition-colors">
                  Comunidade VIP
                </Link>
              </li>
              <li>
                <Link to="/videos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Vídeos Personalizados
                </Link>
              </li>
              <li>
                <Link to="/audios" className="text-muted-foreground hover:text-foreground transition-colors">
                  Áudios Personalizados
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ajuda & FAQ
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} ASMR Luna. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
