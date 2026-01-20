const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
          <svg 
            className="h-8 w-8 text-accent-foreground" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
            />
          </svg>
        </div>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground">
          Projeto em Branco
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Tudo pronto para começar. Descreva o que você quer construir.
        </p>
      </div>
    </div>
  );
};

export default Index;
