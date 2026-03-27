import Link from 'next/link';
import { appName } from '@/lib/shared';

export default function HomePage() {
  const getLogoPath = () => {
    return process.env.NODE_ENV === "production" ? "/clientshell/logo.png" : "/logo.png";
  };

  return (
    <div className="flex flex-col items-center justify-center text-center flex-1 min-h-[80vh] px-4">
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
        {/* Logo and Impacting Heading */}
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-3xl opacity-20 bg-blue-500 rounded-full w-full h-full animate-pulse transition-all"></div>
          <img
            src={getLogoPath()}
            alt={`${appName} logo`}
            className="w-32 h-32 md:w-48 md:h-48 relative z-10"
          />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight">
          Type-safe environment configurations injected cleanly into <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-600">static builds.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
          Write a TypeScript schema. Build once. Inject the environment variables identically across every environment using an ultra-fast Go runtime. Zero polling. Zero generic windows.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/docs"
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Get Started
          </Link>
          <a
            href={`https://github.com/yonigofman/clientshell`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            GitHub
          </a>
        </div>
        
        {/* Terminal/Code snippet feature to show exactly how cool it is */}
        <div className="mt-16 w-full max-w-3xl text-left bg-[#0d1117] rounded-lg border border-border overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center px-4 py-2 border-b border-gray-800 bg-[#161b22]">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="mx-auto text-xs font-mono text-gray-500">src/env.schema.ts</div>
          </div>
          <div className="p-4 overflow-x-auto text-sm font-mono text-gray-300">
            <pre>
              <code className="block">
                <span className="text-[#ff7b72]">import</span> &#123; defineSchema, string &#125; <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">"@clientshell/core"</span>;
                <br /><br />
                <span className="text-[#ff7b72]">export const</span> <span className="text-[#79c0ff]">clientEnvSchema</span> = defineSchema(&#123;
                <br />  &nbsp;&nbsp;API_URL: string(&#123; required: <span className="text-[#79c0ff]">true</span> &#125;),
                <br />&#125;);
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
