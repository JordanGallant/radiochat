'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; // 👈 Fix: Import from shared package

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ChatWithAuth() {
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Load current session + listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Realtime messages subscription
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    loadMessages();

    // 👇 Fix: Wrap async cleanup in a sync function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const loadMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await supabase.from('messages').insert({
      content: newMessage,
      user_id: session?.user?.id,
      username: session?.user?.user_metadata?.full_name || session?.user?.email,
    });
    setNewMessage('');
  };

  if (!session) {
    return (
      <div className="max-w-sm mx-auto mt-10">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          onlyThirdPartyProviders
          theme="dark"
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 border border-gray-700 rounded-2xl p-4 bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🎧 Live Radio Chat</h2>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-gray-400 hover:text-white"
        >
          Sign Out
        </button>
      </div>

      <div className="h-64 overflow-y-auto border border-gray-800 rounded-lg p-3 bg-gray-950">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-semibold text-blue-400">{msg.username || 'Anon'}: </span>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}