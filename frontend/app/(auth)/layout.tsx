export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E1A] relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#0EA5E9]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        {children}
      </div>
    </div>
  )
}