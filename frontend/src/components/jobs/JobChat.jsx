'use client';
import { useState, useEffect, useRef } from 'react';
import { jobsApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/Button';

export function JobChat({ jobId, currentUserId, readOnly = false }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent]   = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);

  const { subscribeToJob } = useWebSocket({
    'message.received': ({ message }) => {
      setMessages(prev => [...prev, message]);
    },
  });

  useEffect(() => {
    jobsApi.getMessages(jobId).then(({ data }) => setMessages(data.data ?? []));
    subscribeToJob(jobId);
  }, [jobId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await jobsApi.sendMessage(jobId, content.trim());
      setContent('');
    } catch {
      // silently ignore — message failed (e.g. job closed race condition)
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-80 border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b text-sm font-medium text-gray-700">
        Chat
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">No messages yet.</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                isMe ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                {!isMe && <p className="text-xs font-medium mb-0.5 opacity-70">{msg.sender_name}</p>}
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {readOnly ? (
        <div className="p-2 border-t text-center text-xs text-gray-400">Chat is closed for this job.</div>
      ) : (
        <form onSubmit={send} className="p-2 border-t flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-brand-500"
          />
          <Button type="submit" size="sm" loading={sending} disabled={!content.trim()}>Send</Button>
        </form>
      )}
    </div>
  );
}
