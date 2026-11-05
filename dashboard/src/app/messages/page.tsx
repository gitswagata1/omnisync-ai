'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Mic, ArrowLeft, Zap, Tag } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket, connectSocket } from '@/lib/socket';
import { cn, formatTime, timeAgo } from '@/lib/utils';
import type { Contact, Message } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConversationPreview {
  contact: Contact;
  lastMessage?: Message;
  unread: number;
}

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [previews, setPreviews] = useState<ConversationPreview[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [composing, setComposing] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContacts();
    const socket = connectSocket();

    socket.on('message_inbound', (msg: Message) => {
      addMessage(msg);
    });
    socket.on('message_outbound', (msg: Message) => {
      addMessage(msg);
    });

    return () => {
      socket.off('message_inbound');
      socket.off('message_outbound');
    };
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedContact]);

  function addMessage(msg: Message) {
    setConversations((prev) => {
      const convId = msg.conversationId;
      const existing = prev[convId] || [];
      if (existing.some((m) => m.id === msg.id)) return prev;
      return { ...prev, [convId]: [...existing, msg] };
    });
  }

  async function loadContacts() {
    try {
      const data = await api.get<{ contacts: Contact[] }>('/api/contacts');
      setContacts(data.contacts);
      const prevs: ConversationPreview[] = data.contacts.map((c) => ({
        contact: c,
        unread: 0,
      }));
      setPreviews(prevs);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function selectContact(contact: Contact) {
    setSelectedContact(contact);
    setMobileShowThread(true);

    if (!conversations[contact.id]) {
      setLoadingMessages(true);
      try {
        const data = await api.get<{ messages: Message[] }>(`/api/messages/${contact.id}`);
        setConversations((prev) => ({ ...prev, [contact.id]: data.messages }));
      } catch {
        setConversations((prev) => ({ ...prev, [contact.id]: [] }));
      } finally {
        setLoadingMessages(false);
      }
    }
  }

  async function handleSend() {
    if (!composing.trim() || !selectedContact || sending) return;
    setSending(true);
    try {
      await api.post('/api/messages/send', {
        contactId: selectedContact.id,
        body: composing.trim(),
      });
      setComposing('');
    } catch {
      // error handled silently
    } finally {
      setSending(false);
    }
  }

  const activeMessages = selectedContact ? conversations[selectedContact.id] || [] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-pulse text-zinc-400">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 overflow-hidden rounded-xl border border-zinc-800">
      {/* Contact List - Left Panel */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r border-zinc-800 bg-zinc-950 flex flex-col',
          mobileShowThread && 'hidden md:flex'
        )}
      >
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            Conversations
          </h2>
          <p className="text-xs text-zinc-500 mt-1">{contacts.length} contacts</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {previews.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No contacts found
            </div>
          ) : (
            previews.map(({ contact, lastMessage, unread }) => (
              <button
                key={contact.id}
                onClick={() => selectContact(contact)}
                className={cn(
                  'w-full text-left p-4 border-b border-zinc-800/50 transition-colors hover:bg-zinc-900',
                  selectedContact?.id === contact.id && 'bg-zinc-900 border-l-2 border-l-emerald-500'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-900/40 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-100 truncate text-sm">{contact.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{contact.company}</p>
                      </div>
                    </div>
                    {lastMessage && (
                      <p className="text-xs text-zinc-500 mt-1 truncate pl-10">
                        {lastMessage.direction === 'outbound' ? 'You: ' : ''}
                        {lastMessage.body.slice(0, 50)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                    {lastMessage && (
                      <span className="text-[10px] text-zinc-600">{timeAgo(lastMessage.createdAt)}</span>
                    )}
                    {unread > 0 && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                    <div className="flex gap-0.5 mt-0.5">
                      {contact.departments.map((d) => (
                        <span key={d} className="text-[9px] text-zinc-600 bg-zinc-800 rounded px-1">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread - Right Panel */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-zinc-950',
          !mobileShowThread && 'hidden md:flex'
        )}
      >
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg">Select a conversation</p>
              <p className="text-zinc-600 text-sm mt-1">Choose a contact to view the message thread</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/50">
              <button
                onClick={() => setMobileShowThread(false)}
                className="md:hidden text-zinc-400 hover:text-zinc-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-10 w-10 rounded-full bg-emerald-900/40 flex items-center justify-center text-emerald-400 font-bold">
                {selectedContact.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-zinc-100">{selectedContact.name}</p>
                <p className="text-xs text-zinc-500">{selectedContact.company} · {selectedContact.phone}</p>
              </div>
              <div className="ml-auto flex gap-1">
                {selectedContact.departments.map((d) => (
                  <Badge key={d} variant="outline">{d}</Badge>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse text-zinc-500">Loading messages...</div>
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-600 text-sm">No messages yet. Send the first message below.</p>
                </div>
              ) : (
                activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5',
                        msg.direction === 'outbound'
                          ? 'bg-emerald-900/30 border border-emerald-800/40 rounded-br-md'
                          : 'bg-zinc-800 border border-zinc-700/40 rounded-bl-md'
                      )}
                    >
                      {msg.roleTag && msg.direction === 'outbound' && (
                        <p className="text-[10px] text-emerald-500/70 font-medium mb-1">{msg.roleTag}</p>
                      )}

                      {msg.contentType === 'audio' ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                            <Mic className="h-3.5 w-3.5" />
                            <span>Voice Note</span>
                          </div>
                          {msg.body && (
                            <p className="text-zinc-300 text-sm mt-1 italic">{msg.body}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-zinc-200 text-sm whitespace-pre-wrap">{msg.body}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="text-[10px] text-zinc-500">{formatTime(msg.createdAt)}</span>
                        {msg.direction === 'outbound' && msg.waMessageId && (
                          <span className="text-[10px] text-emerald-600">✓✓</span>
                        )}
                      </div>

                      {/* LLM Analysis */}
                      {msg.llmAnalysis && Object.keys(msg.llmAnalysis).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-zinc-700/30">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-1">
                            <Zap className="h-3 w-3" />
                            AI Analysis
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {msg.llmAnalysis.intent ? (
                              <span className="text-[10px] bg-blue-900/30 text-blue-400 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                                <Tag className="h-2.5 w-2.5" />
                                {String(msg.llmAnalysis.intent)}
                              </span>
                            ) : null}
                            {msg.llmAnalysis.urgency != null && (
                              <span className={cn(
                                'text-[10px] rounded px-1.5 py-0.5',
                                Number(msg.llmAnalysis.urgency) >= 4
                                  ? 'bg-red-900/30 text-red-400'
                                  : Number(msg.llmAnalysis.urgency) >= 3
                                    ? 'bg-amber-900/30 text-amber-400'
                                    : 'bg-zinc-800 text-zinc-400'
                              )}>
                                Urgency: {String(msg.llmAnalysis.urgency)}/5
                              </span>
                            )}
                            {Array.isArray(msg.llmAnalysis.entities) &&
                              (msg.llmAnalysis.entities as string[]).map((e: string, i: number) => (
                                <span key={i} className="text-[10px] bg-purple-900/30 text-purple-400 rounded px-1.5 py-0.5">
                                  {e}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Compose Area */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={composing}
                  onChange={(e) => setComposing(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={!composing.trim() || sending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
