import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { api } from '../../api/client.js';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Lock, 
  CheckCheck, 
  Clock, 
  FileText, 
  Car, 
  User, 
  Sparkles,
  Search
} from 'lucide-react';

export const MessagesTab = () => {
  const { customers, repairOrders, showToast, currentUser } = useShop();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [channel, setChannel] = useState('sms'); // 'sms' or 'internal_note'
  const [searchCust, setSearchCust] = useState('');

  // Initial customer selection
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomer) {
      setSelectedCustomer(customers[0]);
    }
  }, [customers]);

  // Load messages for customer
  const fetchMessages = async (custId) => {
    if (!custId) return;
    try {
      setLoading(true);
      const res = await api.getMessages(custId);
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn('Could not load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchMessages(selectedCustomer.id);
    }
  }, [selectedCustomer?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedCustomer) return;

    try {
      const activeRo = repairOrders.find(r => r.customerId === selectedCustomer.id);
      const payload = {
        customerId: selectedCustomer.id,
        roId: activeRo?.id || null,
        direction: 'outbound',
        channel,
        senderName: channel === 'sms' 
          ? (currentUser?.name ? `Service Advisor (${currentUser.name})` : 'Service Advisor') 
          : 'Shop Internal Note',
        message: messageText.trim()
      };

      const res = await api.sendMessage(payload);
      if (res.success) {
        showToast(channel === 'sms' ? 'SMS sent to customer device' : 'Internal shop note saved', 'success');
        setMessageText('');
        fetchMessages(selectedCustomer.id);
      }
    } catch (err) {
      showToast(`Failed to send: ${err.message}`, 'error');
    }
  };

  const insertTemplate = (text) => {
    setMessageText(text);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchCust.toLowerCase()) ||
    c.phone?.includes(searchCust)
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: 'calc(100vh - 160px)' }}>
      {/* Left Customer Contacts List */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '800' }}>
            Customer Messages
          </h3>
          <span style={{
            background: 'rgba(0, 210, 255, 0.15)',
            color: '#00d2ff',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            2-Way SMS
          </span>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#070b14',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <Search size={14} color="#8fa0c0" />
          <input
            type="text"
            placeholder="Search customer or phone..."
            value={searchCust}
            onChange={(e) => setSearchCust(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              outline: 'none',
              fontSize: '12px',
              width: '100%'
            }}
          />
        </div>

        {/* Customer List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {filteredCustomers.map(cust => {
            const isSelected = selectedCustomer?.id === cust.id;
            const activeRo = repairOrders.find(r => r.customerId === cust.id);
            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                style={{
                  background: isSelected ? 'rgba(0, 210, 255, 0.12)' : '#070b14',
                  border: `1px solid ${isSelected ? '#00d2ff' : 'rgba(255, 255, 255, 0.04)'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>{cust.name}</span>
                  {activeRo && (
                    <span style={{
                      background: 'rgba(0, 230, 118, 0.15)',
                      color: '#00e676',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700'
                    }}>
                      {activeRo.roNumber}
                    </span>
                  )}
                </div>
                <div style={{ color: '#8fa0c0', fontSize: '12px' }}>{cust.phone}</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>
                  {cust.membership?.tier || 'Standard Member'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Conversation Thread */}
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden'
      }}>
        {selectedCustomer ? (
          <>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '14px'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '17px', fontWeight: '800' }}>
                  {selectedCustomer.name}
                </h3>
                <div style={{ color: '#8fa0c0', fontSize: '12px', marginTop: '2px' }}>
                  Mobile: <strong style={{ color: '#00d2ff' }}>{selectedCustomer.phone}</strong> • Email: {selectedCustomer.email}
                </div>
              </div>

              {/* Mode Selector */}
              <div style={{
                display: 'flex',
                background: '#070b14',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  style={{
                    background: channel === 'sms' ? 'linear-gradient(135deg, #00d2ff, #0070f3)' : 'transparent',
                    color: channel === 'sms' ? '#fff' : '#8fa0c0',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Phone size={12} />
                  <span>SMS to Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('internal_note')}
                  style={{
                    background: channel === 'internal_note' ? 'rgba(255, 179, 0, 0.25)' : 'transparent',
                    color: channel === 'internal_note' ? '#ffb300' : '#8fa0c0',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Lock size={12} />
                  <span>Confidential Internal Note</span>
                </button>
              </div>
            </div>

            {/* Quick Templates */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                `Hi ${selectedCustomer.name.split(' ')[0]}, your vehicle inspection report is complete. Review and sign here:`,
                `Hi ${selectedCustomer.name.split(' ')[0]}, good news! Your vehicle is fully serviced, quality-checked, and ready for pickup at Bay 2.`,
                `Update: The OEM parts arrived from the warehouse and tech is currently installing them now.`,
                `Please confirm approval for the additional brake fluid service recommended on your RO.`
              ].map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertTemplate(tmpl)}
                  style={{
                    background: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#8fa0c0',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {tmpl.substring(0, 40)}...
                </button>
              ))}
            </div>

            {/* Message History Bubble List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '10px 0'
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px' }}>
                  No previous communication thread found for this customer. Send an SMS to initiate contact.
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isOutbound = msg.direction === 'outbound';
                  const isInternal = msg.channel === 'internal_note';
                  return (
                    <div
                      key={msg.id || i}
                      style={{
                        alignSelf: isInternal ? 'center' : isOutbound ? 'flex-end' : 'flex-start',
                        maxWidth: isInternal ? '85%' : '70%',
                        background: isInternal
                          ? 'rgba(255, 179, 0, 0.1)'
                          : isOutbound
                            ? 'linear-gradient(135deg, rgba(0, 210, 255, 0.2), rgba(0, 112, 243, 0.3))'
                            : '#070b14',
                        border: isInternal
                          ? '1px dashed rgba(255, 179, 0, 0.4)'
                          : isOutbound
                            ? '1px solid rgba(0, 210, 255, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '11px',
                        color: isInternal ? '#ffb300' : isOutbound ? '#00d2ff' : '#8fa0c0'
                      }}>
                        <span style={{ fontWeight: '700' }}>
                          {isInternal ? '🔒 Internal Shop Tech Note' : msg.senderName}
                        </span>
                        <span style={{ color: '#64748b' }}>
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ color: '#fff', fontSize: '13px', lineHeight: '1.4' }}>
                        {msg.message}
                      </div>
                      {isOutbound && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#00e676' }}>
                          <CheckCheck size={12} />
                          <span>Delivered via SMS Gateway</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Composer */}
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                gap: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '12px'
              }}
            >
              <input
                type="text"
                placeholder={channel === 'sms' ? `Type SMS message to ${selectedCustomer.phone}...` : 'Write confidential internal technician note...'}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{
                  flex: 1,
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: channel === 'sms' ? 'linear-gradient(135deg, #00d2ff, #0070f3)' : 'linear-gradient(135deg, #ffb300, #ff8f00)',
                  color: channel === 'sms' ? '#fff' : '#070d1a',
                  border: 'none',
                  padding: '0 20px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Send size={15} />
                <span>{channel === 'sms' ? 'Send SMS' : 'Save Note'}</span>
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#8fa0c0', fontSize: '14px' }}>
            Select a customer from the left directory to open their live communication thread.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
