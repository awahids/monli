import { Wallet, Shield, Server, Moon } from "lucide-react";

const items = [
  {
    icon: Wallet,
    text: "Manual Input",
    description:
      "Enter transactions manually - no bank account connection required",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    text: "Private & Secure",
    description:
      "Your financial data stays safe and is never shared with third parties",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Server,
    text: "Access Anywhere",
    description: "Monitor your personal finances from any device",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Moon,
    text: "Simple Design",
    description: "Clean and intuitive interface that's easy to use",
    color: "from-gray-600 to-gray-800",
  },
];

export function TrustSignals() {
  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Trusted by users worldwide
          </h3>
          <p className="text-muted-foreground">
            Built with security, privacy, and user experience in mind
          </p>
        </div>

        <div className="responsive-grid">
          {items.map(({ icon: Icon, text, description, color }, index) => (
            <div
              key={index}
              className="group relative card-enhanced p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-default overflow-hidden"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex flex-col items-center text-center space-y-6">
                <div
                  className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${color} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500 relative`}
                >
                  <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow-sm" />
                  <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-all duration-300">
                    {text}
                  </h4>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed group-hover:text-muted-foreground/90 transition-colors text-balance">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

