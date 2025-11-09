import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <img
                src="/Logo.png"
                onError={(e) =>
                  ((e.currentTarget as HTMLImageElement).src =
                    "/placeholder.svg")
                }
                alt="Commet logo"
                className="h-8 w-8 mr-3 object-cover rounded-lg"
              />
              <span className="text-2xl font-display font-bold">Commet</span>
            </div>
            <div className="hidden md:flex items-center gap-10">
              <a
                href="#"
                className="text-sm text-foreground hover:text-accent transition-colors"
              >
                Examples
              </a>
              <a
                href="#"
                className="text-sm text-foreground hover:text-accent transition-colors"
              >
                Pricing
              </a>
              <a
                href="#"
                className="text-sm text-foreground hover:text-accent transition-colors"
              >
                About
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="border-t border-border mt-32 bg-muted/30 rounded-t-3xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4">
              <div className="flex items-center">
                <img
                  src="/Logo.png"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).src =
                      "/placeholder.svg")
                  }
                  alt="Commet logo"
                  className="h-8 w-8 mr-3 object-cover rounded-lg"
                />
                <span className="text-xl font-display font-bold">Commet</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Professional AI logo generation for modern brands.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-4 text-sm uppercase tracking-wide">
                Product
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Examples
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4 text-sm uppercase tracking-wide">
                Company
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4 text-sm uppercase tracking-wide">
                Legal
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-sm text-muted-foreground">
            © 2025 Commet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
