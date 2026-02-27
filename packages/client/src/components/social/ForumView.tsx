import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/useGameStore';

interface Topic {
    id: string;
    title: string;
    author: { username: string; level: number };
    createdAt: string;
    _count: { posts: number };
}

export function ForumView() {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<any>(null);
    const [newPostContent, setNewPostContent] = useState('');

    const playerId = useGameStore(s => s.playerId);
    // const addToast = useGameStore(s => s.addToast);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/social/forum/categories');
            if (res.ok) setCategories(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchTopics = async (cat: any) => {
        setSelectedCategory(cat);
        setSelectedTopic(null);
        try {
            const res = await fetch(`http://localhost:3000/api/social/forum/category/${cat.id}/topics`);
            if (res.ok) setTopics(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchTopicDetails = async (topicId: string) => {
        try {
            const res = await fetch(`http://localhost:3000/api/social/forum/topic/${topicId}`);
            if (res.ok) setSelectedTopic(await res.json());
        } catch (e) { console.error(e); }
    };

    const addPost = async () => {
        if (!newPostContent.trim() || !selectedTopic) return;
        try {
            const res = await fetch(`http://localhost:3000/api/social/forum/topic/${selectedTopic.id}/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authorId: playerId, content: newPostContent })
            });
            if (res.ok) {
                setNewPostContent('');
                fetchTopicDetails(selectedTopic.id);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="forum-view" style={{ padding: 'var(--space-md)', color: 'var(--text-light)' }}>

            {/* Fil d'ariane / Header */}
            <div style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
                <span
                    style={{ cursor: 'pointer', color: 'var(--gold)' }}
                    onClick={() => { setSelectedCategory(null); setSelectedTopic(null); }}
                >
                    🏛️ {t('nav.tavern')}
                </span>
                {selectedCategory && (
                    <>
                        <span style={{ margin: '0 8px' }}>/</span>
                        <span
                            style={{ cursor: 'pointer', color: 'var(--gold)' }}
                            onClick={() => { setSelectedTopic(null); fetchTopics(selectedCategory); }}
                        >
                            {selectedCategory.name}
                        </span>
                    </>
                )}
                {selectedTopic && (
                    <>
                        <span style={{ margin: '0 8px' }}>/</span>
                        <span style={{ color: 'var(--text-muted)' }}>{selectedTopic.title}</span>
                    </>
                )}
            </div>

            {/* VUE : LISTE DES CATÉGORIES */}
            {!selectedCategory && (
                <div className="panel" style={{ padding: 'var(--space-md)' }}>
                    <h3 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-md)' }}>
                        🍺 {t('social.forumTitle')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => fetchTopics(cat)}
                                style={{
                                    padding: 'var(--space-md)', background: 'var(--bg-dark)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
                                }}
                                className="category-card"
                            >
                                <div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--gold)' }}>{cat.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.description}</div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {cat._count.topics} sujets
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VUE : LISTE DES SUJETS */}
            {selectedCategory && !selectedTopic && (
                <div className="panel" style={{ padding: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h3 className="text-pixel" style={{ color: 'var(--gold)' }}>{selectedCategory.name}</h3>
                        <button className="btn btn--gold btn--sm">{t('social.newTopic')}</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {topics.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>Aucun sujet pour le moment.</p>}
                        {topics.map(t => (
                            <div
                                key={t.id}
                                onClick={() => fetchTopicDetails(t.id)}
                                style={{
                                    padding: 'var(--space-sm)', borderBottom: '1px solid var(--border-medium)', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>{t.title}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        Par {t.author.username} (Lvl {t.author.level})
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                    💬 {t._count.posts}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VUE : DÉTAIL DU SUJET (POSTS) */}
            {selectedTopic && (
                <div className="topic-view" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <h2 className="text-pixel" style={{ color: 'var(--gold)' }}>{selectedTopic.title}</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {selectedTopic.posts.map((post: any) => (
                            <div key={post.id} className="panel" style={{ display: 'flex', gap: 'var(--space-md)', padding: 0, overflow: 'hidden' }}>
                                {/* Sidebar Auteur */}
                                <div style={{ width: '120px', background: 'var(--bg-dark)', padding: 'var(--space-sm)', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                                    <div style={{ width: '64px', height: '64px', background: '#000', margin: '0 auto var(--space-xs)', border: '1px solid var(--gold)' }}>
                                        {/* TODO: LayeredSprite Animation Idle du joueur */}
                                    </div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--gold)' }}>{post.author.username}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lvl {post.author.level}</div>
                                </div>
                                {/* Contenu Post */}
                                <div style={{ flex: 1, padding: 'var(--space-md)', position: 'relative' }}>
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{post.content}</div>
                                    <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                        {new Date(post.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="panel" style={{ padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                        <textarea
                            value={newPostContent}
                            onChange={e => setNewPostContent(e.target.value)}
                            placeholder={t('social.replyPlaceholder')}
                            style={{ width: '100%', height: '100px', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-sm)' }}>
                            <button className="btn btn--gold" onClick={addPost}>{t('social.postReply')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
