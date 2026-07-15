import React from 'react';

export const OpenSlide: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-white/10">
                <h1 className="text-lg font-semibold text-white">Open Slide</h1>
                <p className="text-sm text-gray-400">
                    Decks agent-authored — o conteúdo é escrito por um agente de código (Claude Code) direto no
                    workspace. Esta tela mostra o viewer/present mode.
                </p>
            </div>
            <iframe
                title="Open Slide"
                src="/open-slide/"
                className="flex-1 w-full border-0"
            />
        </div>
    );
};
