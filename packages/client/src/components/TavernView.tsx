import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export interface ChatMessage {
    id: string;
    content: string;
    channel: string;
    createdAt: string;
    senderId: string;
    sender: {
        id: string;
        username: string;
        role: string;
    };
}

export function TavernView({ socket }: { socket: React.RefObject<any> }) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [onlineCount, setOnlineCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const player = useGameStore(s => s.player);

    useEffect(() => {
        const sock = socket.current;
        if (!sock) return;

        // Joindre la room "Taverne"
        if (player) {
            sock.emit('chat:join', { userId: player.id });
        }

        const handleHistory = (data: { messages: ChatMessage[] }) => {
            setMessages(data.messages);
            scrollToBottom();
        };

        const handleReceive = (msg: ChatMessage) => {
            setMessages(prev => [...prev, msg].slice(-100)); // Garder les 100 derniers msgs max
            scrollToBottom();
        };

        const handlePresence = (data: { onlineCount: number }) => {
            setOnlineCount(data.onlineCount);
        };

        sock.on('chat:history', handleHistory);
        sock.on('chat:receive', handleReceive);
        sock.on('chat:presence', handlePresence);

        return () => {
            sock.off('chat:history', handleHistory);
            sock.off('chat:receive', handleReceive);
            sock.off('chat:presence', handlePresence);
        };
    }, [socket, player]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !player) return;

        socket.current?.emit('chat:send', {
            userId: player.id,
            content: inputValue
        });

        setInputValue('');
    };

    const getRoleAvatar = (role: string) => {
        if (role === 'ADMIN') return '👑';
        if (role === 'MODERATOR') return '⚖️';
        return '🗡️';
    };

    const getMessageColor = (role: string) => {
        if (role === 'ADMIN') return 'var(--gold)';
        if (role === 'MODERATOR') return 'var(--mystic)';
        return 'var(--text-light)';
    };

    return (
        <div className="panel" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Taverne */}
            <div className="panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <span className="text-pixel" style={{ fontSize: 'var(--text-lg)', color: 'var(--gold)' }}>
                    {t('tavern.title')}
                </span>
                <span className="badge badge--common" style={{ color: 'var(--emerald)' }}>
                    🟢 {t('tavern.onlineCount', { count: onlineCount })}
                </span>
            </div>

            {/* Chat Box */}
            <div style={{
                flex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)'
            }}>
                {messages.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
                        {t('tavern.emptyChat')}
                    </p>
                )}

                {messages.map((msg, index) => {
                    const isSystem = msg.senderId === 'SYSTEM';
                    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    if (isSystem) {
                        return (
                            <div key={msg.id || index} style={{ color: 'var(--gold)', fontSize: '0.85rem', fontStyle: 'italic', background: 'rgba(255, 215, 0, 0.1)', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                                <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                        );
                    }

                    const isMe = player?.id === msg.senderId;

                    return (
                        <div key={msg.id || index} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                                <span>{getRoleAvatar(msg.sender.role)} </span>
                                <span style={{ color: getMessageColor(msg.sender.role), fontWeight: isMe ? 'bold' : 'normal' }}>
                                    {msg.sender.username}
                                </span>
                                <span style={{ marginLeft: 'var(--space-xs)' }}>{time}</span>
                            </div>
                            <div style={{
                                background: isMe ? 'var(--dark-crimson)' : 'var(--bg-dark)',
                                padding: 'var(--space-sm) var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                borderBottomRightRadius: isMe ? 0 : 'var(--radius-md)',
                                borderBottomLeftRadius: isMe ? 'var(--radius-md)' : 0,
                                color: 'var(--text-light)',
                                maxWidth: '80%',
                                wordBreak: 'break-word',
                                border: `1px solid ${isMe ? 'var(--fire)' : 'var(--border)'}`
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t('tavern.placeholder')}
                    style={{ flex: 1, padding: 'var(--space-sm)', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                    maxLength={500}
                />
                <button type="submit" className="btn btn--gold" disabled={!inputValue.trim()}>
                    {t('tavern.send')}
                </button>
            </form>
        </div>
    );
}
