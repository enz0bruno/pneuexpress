/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, X, Plus, Minus, Trash2, Mail, MapPin, Clock, Search, CheckCircle2, Truck, RefreshCw, Trophy, CreditCard, ShieldCheck, ArrowLeftRight, Fuel, Droplets, Volume2, Smartphone, AlertCircle } from 'lucide-react';
import { PRODUCTS, CARS, BRANDS, Product, TIRE_IMAGE, FEATURED_TIRE } from './data';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) 
  : null;

interface CartItem extends Product {
  cartId: number;
  qty: number;
}

const SHIPPING_COST = 12.99;

const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    'A': 'text-green-600',
    'B': 'text-lime-500',
    'C': 'text-yellow-500',
    'D': 'text-orange-500',
    'E': 'text-red-500',
    'F': 'text-red-700',
    'G': 'text-gray-900'
  };
  return colors[grade] || 'text-black';
};

const getNoiseColor = (noise: number) => {
  if (noise <= 69) return 'text-green-600';
  if (noise <= 71) return 'text-yellow-500';
  return 'text-orange-500';
};

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<'shop' | 'tracking'>('shop');
  const [order, setOrder] = useState<{id: string, items: CartItem[], total: number, date: Date, status: string} | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [checkoutData, setCheckoutData] = useState({
    name: '', email: '', phone: '', cpf: '',
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
    cardNumber: '', cardName: '', cardExpiry: '', cardCvv: ''
  });

  const handleCheckoutChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCheckoutData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinishCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'pix') {
      setCheckoutStep(4); // Show QR Code and wait
      processOrder();
    } else {
      processOrder();
    }
  };

  const processOrder = async () => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const totalWithShipping = subtotal + SHIPPING_COST;
    const finalTotal = paymentMethod === 'pix' ? (subtotal * 0.85) + SHIPPING_COST : totalWithShipping;
    
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      items: [...cart],
      total: finalTotal,
      date: new Date(),
      status: 'Aguardando Pagamento'
    };
    setOrder(newOrder);
    
    if (paymentMethod === 'pix') {
      setIsGeneratingQR(true);
      try {
        const response = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: finalTotal,
            items: cart,
            customer: checkoutData
          })
        });
        const data = await response.json();
        setPaymentId(data.paymentId);
        setQrCodeData(data.qrCodeData);
        setPixCode(data.pixCode);
        setIsGeneratingQR(false);
        setIsVerifyingPayment(true);
      } catch (error) {
        console.error('Error creating payment:', error);
        showToast('Erro ao gerar pagamento. Tente novamente.');
        setIsGeneratingQR(false);
      }
    } else {
      // Stripe Checkout Integration
      if (!stripePromise) {
        showToast('Sistema de pagamento não configurado. Adicione as chaves do Stripe.');
        return;
      }

      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            customer: checkoutData,
            successUrl: `${window.location.origin}/?payment=success&orderId=${newOrder.id}`,
            cancelUrl: `${window.location.origin}/?payment=cancel`,
          }),
        });

        const session = await response.json();
        if (session.error) throw new Error(session.error);

        const stripe = (await stripePromise) as any;
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: session.id,
          });
          if (error) throw error;
        }
      } catch (error: any) {
        console.error('Stripe error:', error);
        showToast(`Erro no pagamento: ${error.message}`);
      }
    }
  };

  // Handle Stripe Redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const orderId = urlParams.get('orderId');

    if (payment === 'success' && orderId) {
      showToast('Pagamento confirmado com sucesso!');
      setCart([]);
      setView('tracking');
      // In a real app, you'd fetch the order details from the server here
      setOrder({
        id: orderId,
        items: [], // You might want to store this in localStorage or fetch from DB
        total: 0,
        date: new Date(),
        status: 'Pago'
      });
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === 'cancel') {
      showToast('Pagamento cancelado.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Polling for payment status
  useEffect(() => {
    let interval: any;
    if (isVerifyingPayment && paymentId && checkoutStep === 4) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/payment/status/${paymentId}`);
          const data = await response.json();
          if (data.status === 'confirmed') {
            clearInterval(interval);
            setIsVerifyingPayment(false);
            setCheckoutStep(5);
            showToast('Pagamento confirmado pelo sistema!');
            
            setTimeout(() => {
              setIsCheckoutOpen(false);
              setCart([]);
              setView('tracking');
              setCheckoutStep(1);
              setPaymentId(null);
              setQrCodeData(null);
            }, 4000);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isVerifyingPayment, paymentId, checkoutStep]);

  const notifyPayment = async () => {
    if (!paymentId) return;
    try {
      const response = await fetch('/api/payment/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: paymentId })
      });
      if (response.ok) {
        showToast('Notificação enviada! Aguardando confirmação do lojista.');
      }
    } catch (error) {
      console.error('Error notifying payment:', error);
    }
  };

  const fetchAdminOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      setAdminOrders(data);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
    }
  };

  const confirmAdminPayment = async (orderId: string) => {
    try {
      const response = await fetch('/api/admin/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (response.ok) {
        showToast('Pagamento confirmado com sucesso!');
        fetchAdminOrders();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  useEffect(() => {
    if (isAdminView) {
      fetchAdminOrders();
      const interval = setInterval(fetchAdminOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [isAdminView]);
  
  const toggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        showToast(`- ${product.brand} removido da comparação`);
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 3) {
        showToast('Máximo de 3 pneus para comparar!');
        return prev;
      }
      showToast(`+ ${product.brand} adicionado para comparar`);
      return [...prev, product];
    });
  };
  
  // Search states
  const [searchMarca, setSearchMarca] = useState('');
  const [searchModelo, setSearchModelo] = useState('');
  const [searchLargura, setSearchLargura] = useState('');
  const [searchPerfil, setSearchPerfil] = useState('');
  const [searchAro, setSearchAro] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: Product[], label: string } | null>(null);

  // Catalog states
  const [activeFilter, setActiveFilter] = useState('todos');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, cartId: Date.now(), qty: 1 }];
    });
    showToast(`✓ ${product.brand} ${product.size} adicionado!`);
  };

  const updateQty = (cartId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeFromCart = (cartId: number) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
    showToast('Carrinho limpo!');
  };

  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.qty, 0), [cart]);
  const cartTotal = useMemo(() => cartSubtotal + (cart.length > 0 ? SHIPPING_COST : 0), [cartSubtotal, cart.length]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);

  const handleCarSearch = () => {
    if (!searchMarca || !searchModelo) return;
    const medidas = CARS[searchMarca][searchModelo] || [];
    const found = PRODUCTS.filter(p => medidas.includes(p.size));
    setSearchResults({ products: found, label: `${searchMarca} ${searchModelo}` });
  };

  const handleMedidaSearch = () => {
    if (!searchLargura || !searchPerfil || !searchAro) {
      showToast('Selecione largura, perfil e aro!');
      return;
    }
    const medida = `${searchLargura}/${searchPerfil} R${searchAro}`;
    const found = PRODUCTS.filter(p => p.size === medida);
    setSearchResults({ products: found, label: `medida ${medida}` });
  };

  const clearSearch = () => {
    setSearchResults(null);
    setSearchMarca('');
    setSearchModelo('');
    setSearchLargura('');
    setSearchPerfil('');
    setSearchAro('');
  };

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'todos') return PRODUCTS;
    return PRODUCTS.filter(p => p.cat === activeFilter);
  }, [activeFilter]);

  if (view === 'tracking' && order) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] font-sans text-black">
        <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-[100] border-b border-border px-8 py-4 flex justify-between items-center shadow-sm">
          <h1 className="text-2xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => setView('shop')}>Pneu<span className="text-ac">Express</span></h1>
          <button onClick={() => setView('shop')} className="text-[0.7rem] font-bold uppercase tracking-widest hover:text-ac transition-colors border border-border px-4 py-2 rounded-sm">Voltar para a Loja</button>
        </nav>

        <main className="pt-32 px-4 pb-20 max-w-4xl mx-auto">
          <div className="bg-white rounded-sm shadow-xl border border-border overflow-hidden">
            <div className="bg-ac p-8 md:p-12 text-black">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] opacity-70 mb-2">Pedido #{order.id}</p>
                  <h2 className="font-display text-4xl tracking-wider leading-none">STATUS DO PEDIDO</h2>
                </div>
                <div className="md:text-right">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] opacity-70 mb-2">Previsão de Entrega</p>
                  <p className="font-display text-2xl tracking-wider">Até {new Date(order.date.getTime() + 48 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12 space-y-12">
              {/* Progress Bar */}
              <div className="relative flex justify-between">
                <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-100 z-0"></div>
                <div className="absolute top-5 left-0 h-[2px] bg-green-500 z-0 transition-all duration-1000" style={{ width: '33%' }}></div>
                
                {[
                  { icon: CheckCircle2, label: 'Pagamento', active: true },
                  { icon: Smartphone, label: 'Preparação', active: true },
                  { icon: Truck, label: 'Em Trânsito', active: false },
                  { icon: ShoppingCart, label: 'Entregue', active: false }
                ].map((step, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center w-20">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-colors duration-500 ${step.active ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <p className={`text-[0.6rem] font-bold uppercase mt-3 tracking-widest text-center ${step.active ? 'text-black' : 'text-gray-400'}`}>{step.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-green-50 border border-green-100 rounded-sm">
                    <div className="bg-green-500 p-2 rounded-full text-white shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800 text-[0.85rem] uppercase tracking-wider mb-1">Pagamento Confirmado</h4>
                      <p className="text-[0.8rem] text-green-700 leading-relaxed">O sistema verificou o seu depósito PIX. Seu produto já saiu para a triagem e será entregue dentro do prazo estipulado.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-display text-xl tracking-wider border-b border-border pb-2">ITENS</h3>
                    {order.items.map(item => (
                      <div key={item.cartId} className="flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 bg-gray-50 border border-border p-1 rounded-sm">
                            <img src={item.image} className="w-full h-full object-contain" alt="" />
                          </div>
                          <div>
                            <p className="text-[0.8rem] font-bold text-black">{item.brand} {item.size}</p>
                            <p className="text-[0.65rem] text-gray-500 uppercase tracking-widest">{item.qty} unidade(s)</p>
                          </div>
                        </div>
                        <span className="font-bold text-[0.85rem]">R$ {(item.price * item.qty).toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-8 rounded-sm border border-border space-y-4">
                    <h3 className="font-display text-xl tracking-wider border-b border-border pb-2">DETALHES</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[0.75rem]">
                        <span className="text-gray-500 uppercase tracking-widest">Data do Pedido</span>
                        <span className="font-medium">{order.date.toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-[0.75rem]">
                        <span className="text-gray-500 uppercase tracking-widest">Método</span>
                        <span className="font-medium">PIX (15% OFF)</span>
                      </div>
                      <div className="flex justify-between text-[0.75rem]">
                        <span className="text-gray-500 uppercase tracking-widest">Subtotal</span>
                        <span className="font-medium">R$ {order.items.reduce((acc, item) => acc + item.price * item.qty, 0).toLocaleString('pt-BR')} {order.total < (order.items.reduce((acc, item) => acc + item.price * item.qty, 0) + SHIPPING_COST) && <span className="text-green-600 ml-1">(R$ {(order.items.reduce((acc, item) => acc + item.price * item.qty, 0) * 0.85).toLocaleString('pt-BR')})</span>}</span>
                      </div>
                      <div className="flex justify-between text-[0.75rem]">
                        <span className="text-gray-500 uppercase tracking-widest">Frete</span>
                        <span className="font-medium">R$ {SHIPPING_COST.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-[0.75rem] pt-4 border-t border-border">
                        <span className="text-black font-bold uppercase tracking-widest">Total Pago</span>
                        <span className="text-xl font-black text-ac">R$ {order.total.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border border-dashed border-border rounded-sm">
                    <p className="text-[0.7rem] text-gray-500 italic leading-relaxed">
                      * O rastreamento detalhado será atualizado assim que a transportadora coletar o produto em nosso centro de distribuição.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[200] flex justify-between items-center px-6 md:px-12 py-4 bg-white/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <a href="#inicio" className="font-display text-2xl tracking-wider text-black no-underline">
            PNEU <span className="text-ac">EXPRESS BR</span>
          </a>
          {!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && (
            <div className="hidden lg:flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[0.65rem] font-bold border border-red-100">
              <AlertCircle className="w-3 h-3" />
              CONFIGURAÇÃO PENDENTE: ADICIONE AS CHAVES DO STRIPE
            </div>
          )}
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              boxShadow: [
                "0 0 5px rgba(245,200,0,0.3)",
                "0 0 25px rgba(245,200,0,0.8)",
                "0 0 5px rgba(245,200,0,0.3)"
              ]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="bg-ac text-black px-4 py-1.5 rounded-full text-[0.75rem] font-black tracking-tighter flex items-center gap-1.5 border-2 border-black/10"
          >
            <span className="animate-bounce">🔥</span> 15% OFF NO PIX
          </motion.div>
        </div>
        <ul className="hidden md:flex gap-8 list-none">
          <li><a href="#busca" className="text-[#555] no-underline text-[0.82rem] tracking-widest uppercase transition-colors hover:text-black">Buscar Pneu</a></li>
          <li><a href="#produtos" className="text-[#555] no-underline text-[0.82rem] tracking-widest uppercase transition-colors hover:text-black">Catálogo</a></li>
          <li><a href="#marcas" className="text-[#555] no-underline text-[0.82rem] tracking-widest uppercase transition-colors hover:text-black">Marcas</a></li>
          <li><a href="#vantagens" className="text-[#555] no-underline text-[0.82rem] tracking-widest uppercase transition-colors hover:text-black">Vantagens</a></li>
          <li><a href="#contato" className="bg-ac text-black px-5 py-2 rounded-sm font-semibold text-[0.82rem] tracking-widest uppercase transition-colors hover:bg-ac2">Orçamento</a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="min-h-screen flex items-center px-6 md:px-12 pt-32 pb-16 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_80%_50%,rgba(245,200,0,0.07)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_60px,rgba(255,255,255,0.012)_60px,rgba(255,255,255,0.012)_61px)] pointer-events-none" />
        
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute -right-16 top-1/2 -translate-y-1/2 w-[240px] md:w-[580px] h-[240px] md:h-[580px] opacity-[0.03] md:opacity-[0.05] pointer-events-none"
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="95" fill="none" stroke="#000" strokeWidth="14"/>
            <circle cx="100" cy="100" r="66" fill="none" stroke="#000" strokeWidth="8"/>
            <circle cx="100" cy="100" r="26" fill="none" stroke="#000" strokeWidth="5"/>
            <g stroke="#000" strokeWidth="4">
              <line x1="100" y1="5" x2="100" y2="34"/><line x1="100" y1="166" x2="100" y2="195"/>
              <line x1="5" y1="100" x2="34" y2="100"/><line x1="166" y1="100" x2="195" y2="100"/>
              <line x1="27" y1="27" x2="47" y2="47"/><line x1="153" y1="153" x2="173" y2="173"/>
              <line x1="173" y1="27" x2="153" y2="47"/><line x1="47" y1="153" x2="27" y2="173"/>
            </g>
          </svg>
        </motion.div>

        <div className="relative max-w-[680px]">
          <p className="text-[0.72rem] tracking-[0.32em] uppercase text-ac mb-6">● Pneus · Entrega Rápida · Melhor Preço</p>
          <h1 className="font-display text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.92] tracking-wider mb-8 text-black">
            PNEUS QUE<br/><span className="text-ac">DOMINAM</span><br/>A ESTRADA
          </h1>
          <p className="text-base font-light text-[#555] leading-relaxed max-w-[460px] mb-12">
            Encontre o pneu certo para o seu carro em segundos. Mais de 48 modelos das melhores marcas, com entrega em todo o Brasil.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#busca" className="bg-ac text-black px-9 py-4 font-semibold text-[0.85rem] tracking-widest uppercase rounded-sm transition-all hover:bg-ac2 hover:-translate-y-0.5">Buscar Meu Pneu</a>
            <a href="#produtos" className="bg-transparent text-black border border-border px-9 py-4 font-semibold text-[0.85rem] tracking-widest uppercase rounded-sm transition-all hover:border-black hover:-translate-y-0.5">Ver Catálogo Completo</a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-white border-y border-border">
        {[
          { n: '48+', l: 'Modelos em Estoque' },
          { n: '48h', l: 'Entrega Expressa' },
          { n: '12x', l: 'Sem Juros' },
          { n: '15%', l: 'Desconto no PIX' }
        ].map((s, i) => (
          <div key={i} className="p-7 text-center border-r border-border last:border-r-0">
            <span className="font-display text-4xl text-ac block">{s.n}</span>
            <span className="text-[0.72rem] text-[#777] tracking-widest uppercase">{s.l}</span>
          </div>
        ))}
      </div>

      {/* Search Section */}
      <section id="busca" className="px-6 md:px-12 py-24 bg-white">
        <p className="text-[0.7rem] tracking-[0.34em] uppercase text-ac mb-3">Encontre o seu pneu</p>
        <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-none mb-10 text-black">BUSCAR MEU PNEU</h2>
        <p className="text-[0.95rem] text-[#555] font-light leading-relaxed mb-8 max-w-[600px]">
          Selecione o seu carro <strong>ou</strong> informe a medida do pneu diretamente (encontra impressa na lateral do pneu atual ou na tampa do tanque).
        </p>

        <div className="flex flex-col md:flex-row gap-[1px] bg-border mb-[1px] max-w-[860px] border border-border">
          <select 
            className="flex-1 bg-card text-black p-4 font-sans text-[0.88rem] outline-none cursor-pointer focus:bg-[#f9f9f9]"
            value={searchMarca}
            onChange={(e) => { setSearchMarca(e.target.value); setSearchModelo(''); }}
          >
            <option value="">🚗 Marca do carro</option>
            {Object.keys(CARS).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select 
            className="flex-1 bg-card text-black p-4 font-sans text-[0.88rem] outline-none cursor-pointer focus:bg-[#f9f9f9]"
            value={searchModelo}
            onChange={(e) => setSearchModelo(e.target.value)}
            disabled={!searchMarca}
          >
            <option value="">Selecione o modelo</option>
            {searchMarca && Object.keys(CARS[searchMarca]).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button 
            onClick={handleCarSearch}
            className="bg-ac text-black font-semibold text-[0.85rem] tracking-widest uppercase p-4 px-8 transition-colors hover:bg-ac2 disabled:opacity-50"
            disabled={!searchModelo}
          >
            Buscar
          </button>
        </div>

        <div className="flex items-center gap-4 my-6 max-w-[860px] text-[#777] text-[0.8rem] tracking-[0.15em]">
          <div className="flex-1 h-[1px] bg-border" />
          OU BUSQUE PELA MEDIDA DO PNEU
          <div className="flex-1 h-[1px] bg-border" />
        </div>

        <div className="flex flex-col md:flex-row gap-[1px] bg-border max-w-[860px] border border-border">
          <select className="flex-1 bg-card text-black p-4 font-sans text-[0.88rem] outline-none cursor-pointer focus:bg-[#f9f9f9]" value={searchLargura} onChange={e => setSearchLargura(e.target.value)}>
            <option value="">Largura</option>
            {['155','165','175','185','195','205','215','225','235','245','255','265'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select className="flex-1 bg-card text-black p-4 font-sans text-[0.88rem] outline-none cursor-pointer focus:bg-[#f9f9f9]" value={searchPerfil} onChange={e => setSearchPerfil(e.target.value)}>
            <option value="">Perfil</option>
            {['40','45','50','55','60','65','70','75','80'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select className="flex-1 bg-card text-black p-4 font-sans text-[0.88rem] outline-none cursor-pointer focus:bg-[#f9f9f9]" value={searchAro} onChange={e => setSearchAro(e.target.value)}>
            <option value="">Aro</option>
            {['13','14','15','16','17','18','19','20'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button 
            onClick={handleMedidaSearch}
            className="bg-ac text-black font-semibold text-[0.85rem] tracking-widest uppercase p-4 px-8 transition-colors hover:bg-ac2"
          >
            🔍 Buscar
          </button>
        </div>

        {searchResults && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <div className="flex justify-between items-end mb-6">
              <h3 className="font-display text-2xl tracking-wider text-black">
                {searchResults.products.length} pneu(s) encontrado(s) para {searchResults.label}
              </h3>
              <button 
                onClick={clearSearch}
                className="text-[0.72rem] tracking-widest uppercase text-[#777] hover:text-ac transition-colors border-b border-transparent hover:border-ac pb-1"
              >
                Limpar Busca
              </button>
            </div>
            {searchResults.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1px] bg-border border border-border">
                {searchResults.products.map(p => (
                  <ProductCard 
                    key={p.id} 
                    product={p} 
                    onAdd={addToCart} 
                    onQuickView={setSelectedProduct}
                    onCompare={toggleCompare}
                    isComparing={compareList.some(cp => cp.id === p.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-[#777] bg-card border border-border">
                <Search className="w-10 h-10 mx-auto mb-4 opacity-50" />
                <p className="text-[0.9rem] leading-relaxed">Nenhum pneu encontrado para essa combinação.<br/>Entre em contato para encomenda especial!</p>
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* Catalog Section */}
      <section id="produtos" className="px-6 md:px-12 py-24 bg-white">
        <p className="text-[0.7rem] tracking-[0.34em] uppercase text-ac mb-3">Catálogo Completo</p>
        <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-none mb-10 text-black">TODOS OS PNEUS</h2>
        
        <div className="flex flex-wrap gap-2.5 mb-10">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'popular', label: 'Carros Populares' },
            { id: 'passeio', label: 'Passeio' },
            { id: 'suv', label: 'SUV / 4×4' },
            { id: 'esportivo', label: 'Esportivo' },
            { id: 'utilitario', label: 'Utilitário' }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 font-sans text-[0.75rem] tracking-widest uppercase rounded-sm border transition-all ${activeFilter === f.id ? 'border-ac text-ac bg-ac/10' : 'border-border text-[#777] hover:border-ac hover:text-black hover:bg-ac/5'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {activeFilter === 'todos' && (
          <div className="mb-16 bg-card border border-border overflow-hidden flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 p-12 bg-gray-50 flex items-center justify-center min-h-[400px]">
              <img 
                src={FEATURED_TIRE} 
                alt="Pneu em Destaque" 
                className="w-full max-w-[450px] h-auto object-contain hover:scale-110 transition-transform duration-700 drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-full md:w-1/2 p-12 space-y-6">
              <div>
                <p className="text-[0.7rem] tracking-[0.34em] uppercase text-ac mb-2">Lançamento Exclusivo</p>
                <h3 className="font-display text-4xl tracking-wider text-black">PNEU EXPRESS PRO</h3>
                <p className="text-[0.85rem] text-[#777] mt-2 font-light tracking-widest uppercase">Performance & Segurança Máxima · Valor referente a 1 unidade</p>
              </div>
              <p className="text-[0.9rem] text-[#555] leading-relaxed">
                Apresentamos o novo padrão em pneus de alta performance. Desenvolvido com tecnologia de ponta para garantir aderência superior em qualquer terreno e durabilidade incomparável.
              </p>
              <div className="flex items-center gap-6">
                <div className="font-display text-4xl tracking-wider text-black">
                  R$ 450,00
                  <small className="font-sans text-[0.75rem] text-[#777] block font-light">ou 12x de R$ 37,50</small>
                </div>
                <button 
                  onClick={() => addToCart(PRODUCTS.find(p => p.id === 55) || PRODUCTS[0])}
                  className="bg-ac text-black px-10 py-4 font-semibold text-[0.85rem] tracking-widest uppercase rounded-sm hover:bg-ac2 transition-all hover:scale-105"
                >
                  Comprar Agora
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1px] bg-border border border-border">
          {filteredProducts.map(p => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onAdd={addToCart} 
              onQuickView={setSelectedProduct}
              onCompare={toggleCompare}
              isComparing={compareList.some(cp => cp.id === p.id)}
            />
          ))}
        </div>
      </section>

      {/* Brands Section */}
      <section id="marcas" className="bg-white py-16 px-6 md:px-12 overflow-hidden border-y border-border">
        <p className="text-[0.7rem] tracking-[0.34em] uppercase text-ac mb-3">Trabalhamos com</p>
        <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-none mb-10 text-black">MARCAS PARCEIRAS</h2>
        
        <div className="relative">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 whitespace-nowrap"
          >
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <span key={i} className="font-display text-3xl tracking-widest text-[#333] transition-colors hover:text-black cursor-default">
                {b}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Advantages Section */}
      <section id="vantagens" className="px-6 md:px-12 py-24 bg-white">
        <p className="text-[0.7rem] tracking-[0.34em] uppercase text-ac mb-3">Por que escolher a gente</p>
        <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-none mb-10 text-black">NOSSAS VANTAGENS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-border border border-border">
          {[
            { icon: <ShieldCheck className="text-ac w-9 h-9" />, title: 'Compra 100% Segura', text: 'Pagamento com criptografia total. Seus dados nunca são compartilhados com terceiros.' },
            { icon: <Truck className="text-ac w-9 h-9" />, title: 'Entrega Rápida', text: 'Entregamos em todo o Brasil. Capitais em até 48h, interior em até 5 dias úteis.' },
            { icon: <RefreshCw className="text-ac w-9 h-9" />, title: 'Troca Sem Burocracia', text: 'Troca garantida em 30 dias sem custo adicional caso receba errado ou não fique satisfeito.' },
            { icon: <Trophy className="text-ac w-9 h-9" />, title: 'Produtos Originais', text: 'Trabalhamos somente com distribuidores oficiais. Garantia de fábrica em todos os produtos.' },
            { icon: <Clock className="text-ac w-9 h-9" />, title: 'Suporte Especializado', text: 'Equipe técnica pronta para ajudar você a encontrar o pneu ideal para o seu veículo.' },
            { icon: <CreditCard className="text-ac w-9 h-9" />, title: '12x Sem Juros', text: 'Parcele em até 12x sem juros no cartão ou ganhe 15% de desconto pagando no PIX.' }
          ].map((v, i) => (
            <div key={i} className="bg-card p-10 border-l-2 border-transparent transition-all hover:border-ac hover:bg-[#f9f9f9] shadow-sm hover:shadow-md">
              <div className="mb-5">{v.icon}</div>
              <h3 className="font-display text-xl tracking-wider mb-3 text-black">{v.title}</h3>
              <p className="text-[0.88rem] text-[#555] leading-relaxed font-light">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="px-6 md:px-12 py-24 bg-white">
        <p className="text-[0.7rem] tracking-[0.34em] uppercase text-ac mb-3">Fale Conosco</p>
        <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-none mb-10 text-black">SOLICITE UM ORÇAMENTO</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div className="space-y-8">
            <p className="text-[0.92rem] text-[#555] leading-relaxed font-light">
              Nossa equipe está pronta para ajudar você a encontrar o pneu ideal. Preencha o formulário ou envie uma mensagem diretamente para nosso e-mail.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-[0.88rem] text-[#333]">
                <Mail className="w-5 h-5 text-ac" />
                <span>pneu_expressbr@jim.com</span>
              </div>
              <div className="flex items-center gap-4 text-[0.88rem] text-[#333]">
                <MapPin className="w-5 h-5 text-ac" />
                <span>Av. das Nações Unidas, 4777 — Santo André, SP</span>
              </div>
              <div className="flex items-center gap-4 text-[0.88rem] text-[#333]">
                <Clock className="w-5 h-5 text-ac" />
                <span>Seg–Sex: 8h–18h | Sáb: 8h–13h</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[1px] bg-border border border-border">
            <input className="bg-card border-none text-black p-4 font-sans text-[0.88rem] outline-none border-l-2 border-transparent focus:border-ac focus:bg-[#f9f9f9] transition-all" type="text" placeholder="Seu nome"/>
            <input className="bg-card border-none text-black p-4 font-sans text-[0.88rem] outline-none border-l-2 border-transparent focus:border-ac focus:bg-[#f9f9f9] transition-all" type="email" placeholder="E-mail"/>
            <input className="bg-card border-none text-black p-4 font-sans text-[0.88rem] outline-none border-l-2 border-transparent focus:border-ac focus:bg-[#f9f9f9] transition-all" type="text" placeholder="Modelo do veículo (ex: Fiat Argo 2022)"/>
            <input className="bg-card border-none text-black p-4 font-sans text-[0.88rem] outline-none border-l-2 border-transparent focus:border-ac focus:bg-[#f9f9f9] transition-all" type="text" placeholder="Medida do pneu (ex: 185/65 R15)"/>
            <textarea className="bg-card border-none text-black p-4 font-sans text-[0.88rem] outline-none border-l-2 border-transparent focus:border-ac focus:bg-[#f9f9f9] transition-all min-h-[120px]" placeholder="Mensagem ou dúvida..."></textarea>
            <button 
              className="bg-ac text-black font-semibold text-[0.85rem] tracking-widest uppercase p-4 transition-colors hover:bg-ac2"
              onClick={() => showToast('Solicitação enviada! Retornaremos em breve.')}
            >
              Enviar Solicitação
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border px-6 md:px-12 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-4">
          <a href="#inicio" className="font-display text-3xl tracking-wider text-black no-underline block">
            PNEU <span className="text-ac">EXPRESS BR</span>
          </a>
          <p className="text-[0.83rem] text-[#555] leading-relaxed font-light">
            Especialistas em pneus para todos os veículos. Qualidade, segurança e o melhor custo-benefício para você e sua família.
          </p>
        </div>
        
        <FooterCol title="Categorias" links={[
          { label: 'Carros Populares', href: '#produtos' },
          { label: 'Passeio', href: '#produtos' },
          { label: 'SUV e 4×4', href: '#produtos' },
          { label: 'Esportivos', href: '#produtos' },
          { label: 'Utilitários', href: '#produtos' }
        ]} />
        
        <FooterCol title="Empresa" links={[
          { label: 'Sobre Nós', href: '#' },
          { label: 'Política de Privacidade', href: '#' },
          { label: 'Trocas e Devoluções', href: '#' },
          { label: 'Trabalhe Conosco', href: '#' }
        ]} />
        
        <FooterCol title="Ajuda" links={[
          { label: 'Fale Conosco', href: '#contato' },
          { label: 'Buscar Pneu', href: '#busca' },
          { label: 'FAQ', href: '#' },
          { label: 'Como Escolher', href: '#' }
        ]} />
      </footer>

      <div className="bg-white border-t border-border px-6 md:px-12 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-center">
        <p className="text-[0.75rem] text-[#777]">© 2025 Pneu Express BR. Todos os direitos reservados.</p>
        <div className="flex gap-4 items-center">
          <p className="text-[0.75rem] text-[#777] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-ac" />
            Site sem rastreamento — seus dados são seus.
          </p>
          <button 
            onClick={() => setIsAdminView(!isAdminView)}
            className="text-[0.7rem] text-[#777] opacity-20 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold"
          >
            Admin
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/80 z-[500]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[800px] bg-card z-[510] shadow-2xl overflow-hidden rounded-sm flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 text-[#777] hover:text-black transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="w-full md:w-1/2 bg-gray-50 p-12 flex items-center justify-center">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.brand} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="w-full md:w-1/2 p-10 flex flex-col">
                <p className="text-[0.7rem] tracking-[0.34em] uppercase text-ac mb-2">{selectedProduct.brand}</p>
                <h2 className="font-display text-4xl tracking-wider mb-4 text-black">{selectedProduct.size}</h2>
                
                <div className="space-y-6 flex-1">
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1.5 bg-[#f5f5f5] px-3 py-1.5 rounded-sm border border-border">
                      <Fuel className={`w-4 h-4 ${getGradeColor(selectedProduct.fuel)}`} />
                      <span className="text-[0.75rem] font-bold text-black">{selectedProduct.fuel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#f5f5f5] px-3 py-1.5 rounded-sm border border-border">
                      <Droplets className={`w-4 h-4 ${getGradeColor(selectedProduct.rain)}`} />
                      <span className="text-[0.75rem] font-bold text-black">{selectedProduct.rain}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#f5f5f5] px-3 py-1.5 rounded-sm border border-border">
                      <Volume2 className={`w-4 h-4 ${getNoiseColor(selectedProduct.noise)}`} />
                      <span className="text-[0.75rem] font-bold text-black">{selectedProduct.noise}db</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[0.7rem] tracking-widest uppercase text-[#777] block mb-1">Linha / Modelo</span>
                    <p className="text-[0.95rem] font-semibold text-black">{selectedProduct.label}</p>
                  </div>
                  
                  <div>
                    <span className="text-[0.7rem] tracking-widest uppercase text-[#777] block mb-1">Veículos Compatíveis</span>
                    <p className="text-[0.88rem] text-[#555] leading-relaxed">{selectedProduct.cars}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-border">
                    <div className="font-display text-4xl tracking-wider text-black mb-1">
                      R$ {selectedProduct.price.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-[0.82rem] text-[#777]">Ou 12x de R$ {Math.ceil(selectedProduct.price / 12).toLocaleString('pt-BR')} sem juros · Valor por unidade</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full bg-ac text-black py-4 mt-8 font-semibold text-[0.85rem] tracking-widest uppercase rounded-sm hover:bg-ac2 transition-all hover:-translate-y-0.5"
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Overlay & Panel */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 z-[250]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-[440px] h-screen bg-card border-l border-border z-[300] flex flex-col p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-display text-2xl tracking-wider text-black">CARRINHO</span>
                <div className="flex items-center gap-4">
                  {cart.length > 0 && (
                    <button 
                      onClick={clearCart}
                      className="text-[0.65rem] tracking-widest uppercase text-[#777] hover:text-red-500 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                  <button onClick={() => setIsCartOpen(false)} className="text-[#777] hover:text-black transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <p className="text-[#777] text-[0.88rem] text-center mt-12">Seu carrinho está vazio.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.cartId} className="flex justify-between items-center py-4 border-b border-border gap-3">
                      <div className="w-12 h-12 bg-[#f5f5f5] rounded-sm overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.brand} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.82rem] font-semibold mb-1 truncate text-black">{item.brand}</p>
                        <p className="text-[0.7rem] text-[#777]">{item.size}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => updateQty(item.cartId, -1)} className="bg-[#f5f5f5] text-black w-6 h-6 rounded-sm flex items-center justify-center hover:bg-ac hover:text-black transition-colors border border-border">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[0.82rem] min-w-[16px] text-center text-black">{item.qty}</span>
                        <button onClick={() => updateQty(item.cartId, 1)} className="bg-[#f5f5f5] text-black w-6 h-6 rounded-sm flex items-center justify-center hover:bg-ac hover:text-black transition-colors border border-border">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-display text-lg text-ac flex-shrink-0">R$ {(item.price * item.qty).toLocaleString('pt-BR')}</span>
                      <button onClick={() => removeFromCart(item.cartId)} className="text-[#444] hover:text-ac transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-border pt-6 mt-4 space-y-3">
                  <div className="flex justify-between text-[0.75rem] text-[#777] uppercase tracking-widest">
                    <span>Subtotal</span>
                    <div className="text-right">
                      <span className="block">R$ {cartSubtotal.toLocaleString('pt-BR')}</span>
                      <span className="block text-green-600 text-[0.65rem]">R$ {(cartSubtotal * 0.85).toLocaleString('pt-BR')} no PIX</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[0.75rem] text-[#777] uppercase tracking-widest">
                    <span>Frete</span>
                    <div className="text-right">
                      <span className="block">R$ {SHIPPING_COST.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-display text-2xl text-black pt-2">
                    <span>TOTAL</span>
                    <div className="text-right">
                      <span className="block text-[0.8rem] text-[#777] line-through font-sans">R$ {cartTotal.toLocaleString('pt-BR')}</span>
                      <span className="block">R$ {(cartSubtotal * 0.85 + SHIPPING_COST).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-ac text-black py-4 font-semibold text-[0.85rem] tracking-widest uppercase rounded-sm hover:bg-ac2 transition-colors"
                  >
                    Finalizar Pedido
                  </button>
                  <p className="text-[0.72rem] text-[#777] text-center">12x sem juros no cartão &nbsp;·&nbsp; 15% off no PIX</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Widget */}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-border"
        >
          <Plus className="w-6 h-6 rotate-45" />
        </button>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="bg-ac text-black w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(245,200,0,0.35)] transition-all hover:scale-110 hover:shadow-[0_6px_28px_rgba(245,200,0,0.55)] relative"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-ac w-5 h-5 rounded-full text-[0.68rem] font-bold flex items-center justify-center border border-ac">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="fixed inset-0 bg-black/80 z-[600]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[900px] max-h-[90vh] bg-card z-[610] shadow-2xl overflow-hidden rounded-sm flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="absolute top-4 right-4 text-[#777] hover:text-black transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Order Summary (Side) */}
              <div className="hidden md:flex w-1/3 bg-[#f9f9f9] p-8 flex-col border-r border-border overflow-y-auto">
                <h3 className="font-display text-xl tracking-wider mb-6 text-black">RESUMO</h3>
                <div className="space-y-4 flex-1">
                  {cart.map(item => (
                    <div key={item.cartId} className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-white border border-border p-1">
                        <img src={item.image} alt={item.brand} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.75rem] font-bold truncate text-black">{item.brand}</p>
                        <p className="text-[0.65rem] text-[#777]">{item.qty}x R$ {item.price.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-border mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[0.75rem] text-[#777]">Subtotal</span>
                    <div className="text-right">
                      <span className={`text-[0.85rem] font-semibold ${paymentMethod === 'pix' ? 'text-[#777] line-through text-[0.75rem]' : 'text-black'}`}>R$ {cartSubtotal.toLocaleString('pt-BR')}</span>
                      {paymentMethod === 'pix' && <span className="block text-[0.85rem] font-bold text-green-600">R$ {(cartSubtotal * 0.85).toLocaleString('pt-BR')}</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[0.75rem] text-[#777]">Frete</span>
                    <div className="text-right">
                      <span className="text-[0.75rem] font-bold text-black">R$ {SHIPPING_COST.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <span className="font-display text-lg text-black">TOTAL</span>
                    <span className="font-display text-2xl text-ac">R$ {(paymentMethod === 'pix' ? (cartSubtotal * 0.85) + SHIPPING_COST : cartTotal).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Form Area */}
              <div className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold ${checkoutStep >= 1 ? 'bg-ac text-black' : 'bg-border text-[#777]'}`}>1</div>
                  <div className="h-[1px] flex-1 bg-border"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold ${checkoutStep >= 2 ? 'bg-ac text-black' : 'bg-border text-[#777]'}`}>2</div>
                  <div className="h-[1px] flex-1 bg-border"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold ${checkoutStep >= 3 ? 'bg-ac text-black' : 'bg-border text-[#777]'}`}>3</div>
                  <div className="h-[1px] flex-1 bg-border"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold ${checkoutStep >= 4 ? 'bg-ac text-black' : 'bg-border text-[#777]'}`}>4</div>
                  <div className="h-[1px] flex-1 bg-border"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold ${checkoutStep >= 5 ? 'bg-ac text-black' : 'bg-border text-[#777]'}`}>5</div>
                </div>

                <form onSubmit={handleFinishCheckout} className="space-y-6">
                  {checkoutStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <h4 className="font-display text-lg tracking-wider text-black mb-4">DADOS PESSOAIS</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">Nome Completo</label>
                          <input required name="name" value={checkoutData.name} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="Ex: João Silva" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">CPF</label>
                          <input required name="cpf" value={checkoutData.cpf} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="000.000.000-00" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">E-mail</label>
                          <input required type="email" name="email" value={checkoutData.email} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="joao@exemplo.com" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">Telefone</label>
                          <input required name="phone" value={checkoutData.phone} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="(11) 99999-9999" />
                        </div>
                      </div>
                      <button type="button" onClick={() => setCheckoutStep(2)} className="w-full bg-black text-white py-4 font-semibold text-[0.75rem] tracking-widest uppercase hover:bg-[#222] transition-colors mt-4">Continuar para Entrega</button>
                    </motion.div>
                  )}

                  {checkoutStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <h4 className="font-display text-lg tracking-wider text-black mb-4">ENDEREÇO DE ENTREGA</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1 md:col-span-1">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">CEP</label>
                          <input required name="cep" value={checkoutData.cep} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="00000-000" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">Rua / Logradouro</label>
                          <input required name="street" value={checkoutData.street} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="Av. Paulista" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">Número</label>
                          <input required name="number" value={checkoutData.number} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="123" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">Complemento</label>
                          <input name="complement" value={checkoutData.complement} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="Apto 101" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">Bairro</label>
                          <input required name="neighborhood" value={checkoutData.neighborhood} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="Centro" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">Cidade</label>
                          <input required name="city" value={checkoutData.city} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="São Paulo" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[0.65rem] uppercase tracking-widest text-[#777]">Estado</label>
                          <input required name="state" value={checkoutData.state} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-3 text-[0.85rem] focus:border-ac outline-none transition-colors" placeholder="SP" />
                        </div>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <button type="button" onClick={() => setCheckoutStep(1)} className="flex-1 border border-border text-[#777] py-4 font-semibold text-[0.75rem] tracking-widest uppercase hover:bg-[#f5f5f5] transition-colors">Voltar</button>
                        <button type="button" onClick={() => setCheckoutStep(3)} className="flex-[2] bg-black text-white py-4 font-semibold text-[0.75rem] tracking-widest uppercase hover:bg-[#222] transition-colors">Continuar para Pagamento</button>
                      </div>
                    </motion.div>
                  )}

                  {checkoutStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <h4 className="font-display text-lg tracking-wider text-black">MÉTODO DE PAGAMENTO</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          type="button"
                          onClick={() => setPaymentMethod('pix')}
                          className={`p-4 border-2 flex flex-col items-center gap-2 transition-all rounded-sm ${paymentMethod === 'pix' ? 'border-ac bg-ac/5' : 'border-border hover:border-[#ccc]'}`}
                        >
                          <Smartphone className="w-6 h-6" />
                          <span className="text-[0.75rem] font-bold uppercase tracking-widest">PIX (15% OFF)</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-4 border-2 flex flex-col items-center gap-2 transition-all rounded-sm ${paymentMethod === 'card' ? 'border-ac bg-ac/5' : 'border-border hover:border-[#ccc]'}`}
                        >
                          <CreditCard className="w-6 h-6" />
                          <span className="text-[0.75rem] font-bold uppercase tracking-widest">Cartão</span>
                        </button>
                      </div>

                      {paymentMethod === 'pix' ? (
                        <div className="bg-[#f9f9f9] p-8 text-center space-y-4 border border-dashed border-border rounded-sm">
                          <div className="w-40 h-40 bg-white mx-auto border border-border flex items-center justify-center shadow-sm">
                            <Smartphone className="w-16 h-16 text-[#ccc]" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-[0.82rem] text-[#555] font-medium">O código PIX será gerado após a confirmação.</p>
                            <p className="text-[0.72rem] text-[#777]">Pague e receba aprovação instantânea para agilizar sua entrega.</p>
                          </div>
                          <div className="text-ac font-black text-2xl tracking-tighter">R$ {(cartTotal * 0.85).toLocaleString('pt-BR')}</div>
                        </div>
                      ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="flex gap-4 p-1 bg-[#f5f5f5] rounded-sm border border-border">
                            <button 
                              type="button" 
                              onClick={() => setCardType('credit')} 
                              className={`flex-1 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all rounded-sm ${cardType === 'credit' ? 'bg-white shadow-sm text-black' : 'text-[#777] hover:text-[#444]'}`}
                            >
                              Crédito
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setCardType('debit')} 
                              className={`flex-1 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all rounded-sm ${cardType === 'debit' ? 'bg-white shadow-sm text-black' : 'text-[#777] hover:text-[#444]'}`}
                            >
                              Débito
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[0.65rem] uppercase tracking-widest text-[#777] font-bold">Número do Cartão</label>
                              <div className="relative">
                                <input required name="cardNumber" value={checkoutData.cardNumber} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-4 text-[0.85rem] focus:border-ac outline-none transition-colors rounded-sm pr-12" placeholder="0000 0000 0000 0000" />
                                <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ccc]" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[0.65rem] uppercase tracking-widest text-[#777] font-bold">Nome no Cartão</label>
                              <input required name="cardName" value={checkoutData.cardName} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-4 text-[0.85rem] focus:border-ac outline-none transition-colors rounded-sm" placeholder="COMO ESTÁ NO CARTÃO" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[0.65rem] uppercase tracking-widest text-[#777] font-bold">Validade</label>
                                <input required name="cardExpiry" value={checkoutData.cardExpiry} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-4 text-[0.85rem] focus:border-ac outline-none transition-colors rounded-sm" placeholder="MM/AA" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[0.65rem] uppercase tracking-widest text-[#777] font-bold">CVV</label>
                                <input required name="cardCvv" value={checkoutData.cardCvv} onChange={handleCheckoutChange} className="w-full bg-white border border-border p-4 text-[0.85rem] focus:border-ac outline-none transition-colors rounded-sm" placeholder="123" />
                              </div>
                            </div>
                            {cardType === 'credit' && (
                              <div className="space-y-1">
                                <label className="text-[0.65rem] uppercase tracking-widest text-[#777] font-bold">Parcelamento</label>
                                <select className="w-full bg-white border border-border p-4 text-[0.85rem] focus:border-ac outline-none transition-colors rounded-sm appearance-none cursor-pointer">
                                  <option>1x de R$ {cartTotal.toLocaleString('pt-BR')} sem juros</option>
                                  <option>2x de R$ {(cartTotal/2).toLocaleString('pt-BR')} sem juros</option>
                                  <option>3x de R$ {(cartTotal/3).toLocaleString('pt-BR')} sem juros</option>
                                  <option>6x de R$ {(cartTotal/6).toLocaleString('pt-BR')} sem juros</option>
                                  <option>10x de R$ {(cartTotal/10).toLocaleString('pt-BR')} sem juros</option>
                                  <option>12x de R$ {(cartTotal/12).toLocaleString('pt-BR')} sem juros</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 mt-8">
                        <button type="button" onClick={() => setCheckoutStep(2)} className="flex-1 border border-border text-[#777] py-4 font-semibold text-[0.75rem] tracking-widest uppercase hover:bg-[#f5f5f5] transition-colors rounded-sm">Voltar</button>
                        <button type="submit" className="flex-[2] bg-ac text-black py-4 font-semibold text-[0.85rem] tracking-widest uppercase hover:bg-ac2 transition-colors rounded-sm shadow-lg">Finalizar Compra</button>
                      </div>
                    </motion.div>
                  )}

                  {checkoutStep === 4 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-6">
                      <div className="space-y-2">
                        <h4 className="font-display text-2xl tracking-wider text-black uppercase">Aguardando Pagamento</h4>
                        <p className="text-[0.85rem] text-[#777]">Escaneie o QR Code ou copie o código abaixo.</p>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <div className="relative w-48 h-48 bg-white border-4 border-ac p-3 shadow-xl shrink-0">
                          <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center">
                            {isGeneratingQR ? (
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-ac border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#777]">Gerando...</p>
                              </div>
                            ) : (
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData || 'PneuExpressBR_Payment')}`} 
                                alt="QR Code PIX" 
                                className="w-full h-full" 
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 max-w-xs space-y-4 text-left">
                          <div className="space-y-1">
                            <label className="text-[0.65rem] uppercase tracking-widest text-[#777] font-bold">PIX Copia e Cola</label>
                            <div className="flex gap-2">
                              <input 
                                readOnly 
                                value={pixCode || 'Gerando código...'} 
                                className="flex-1 bg-gray-50 border border-border p-3 text-[0.7rem] font-mono truncate outline-none rounded-sm"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  if (pixCode) {
                                    navigator.clipboard.writeText(pixCode);
                                    showToast('Código PIX copiado!');
                                  }
                                }}
                                className="bg-black text-white px-4 py-2 rounded-sm hover:bg-[#333] transition-colors"
                              >
                                <Smartphone className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 border border-green-100 rounded-sm">
                            <p className="text-[0.65rem] text-green-700 font-medium leading-relaxed">
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              Pagamento instantâneo com 15% de desconto aplicado.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <div className="bg-gray-50 p-4 rounded-sm border border-border inline-block">
                          <p className="text-[0.65rem] uppercase tracking-widest text-[#777] mb-1">Valor Total</p>
                          <p className="text-2xl font-black text-black">R$ {(cartTotal * 0.85).toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-[0.7rem] text-ac font-bold animate-pulse">
                          <div className="w-2 h-2 bg-ac rounded-full"></div>
                          SISTEMA MONITORANDO PAGAMENTO...
                        </div>
                        <button 
                          type="button"
                          onClick={notifyPayment}
                          className="w-full bg-black text-white py-4 font-bold text-[0.75rem] tracking-widest uppercase hover:bg-[#333] transition-colors rounded-sm"
                        >
                          Já realizei o pagamento
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {checkoutStep === 5 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-12">
                      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-display text-3xl tracking-wider text-black uppercase">Pagamento Confirmado!</h4>
                        <p className="text-[0.9rem] text-[#555]">O sistema identificou seu depósito com sucesso.</p>
                      </div>
                      <p className="text-[0.8rem] text-[#777] max-w-sm mx-auto">Seu pedido já foi encaminhado para a triagem. Você será redirecionado para a página de acompanhamento em instantes.</p>
                    </motion.div>
                  )}
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Admin Modal */}
      <AnimatePresence>
        {isAdminView && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/90 z-[1000] overflow-y-auto p-4 md:p-12"
          >
            <div className="max-w-5xl mx-auto bg-white rounded-sm overflow-hidden shadow-2xl">
              <div className="bg-ac p-6 flex justify-between items-center">
                <h2 className="font-display text-2xl tracking-widest uppercase text-black">Painel de Pedidos</h2>
                <button onClick={() => setIsAdminView(false)} className="text-black hover:scale-110 transition-transform">
                  <X className="w-8 h-8" />
                </button>
              </div>
              <div className="p-8">
                {adminOrders.length === 0 ? (
                  <div className="text-center py-20 text-[#777]">Nenhum pedido encontrado.</div>
                ) : (
                  <div className="space-y-6">
                    {adminOrders.map((order) => (
                      <div key={order.id} className="border border-border p-6 rounded-sm hover:border-ac transition-colors">
                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-widest text-[#777] font-bold">Pedido #{order.id}</p>
                            <p className="text-lg font-black text-black">R$ {order.amount.toLocaleString('pt-BR')}</p>
                            <p className="text-[0.75rem] text-[#555]">{new Date(order.date).toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest rounded-full ${
                              order.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status === 'confirmed' ? 'Confirmado' : 
                               order.status === 'processing' ? 'Aguardando Conferência' : 
                               'Pendente'}
                            </span>
                            {order.status !== 'confirmed' && (
                              <button 
                                onClick={() => confirmAdminPayment(order.id)}
                                className="bg-ac text-black px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest hover:bg-ac2 transition-colors rounded-sm"
                              >
                                Confirmar Pagamento
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="border-t border-border pt-4">
                          <p className="text-[0.65rem] uppercase tracking-widest text-[#777] font-bold mb-2">Cliente</p>
                          <p className="text-[0.85rem] font-medium">{order.customer?.name} ({order.customer?.email})</p>
                          <p className="text-[0.85rem] text-[#555]">{order.customer?.address}, {order.customer?.city} - {order.customer?.zip}</p>
                        </div>
                        <div className="mt-4">
                          <p className="text-[0.65rem] uppercase tracking-widest text-[#777] font-bold mb-2">Itens</p>
                          <div className="space-y-1">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="text-[0.8rem] flex justify-between">
                                <span>{item.qty}x {item.brand} {item.size}</span>
                                <span className="font-bold">R$ {(item.price * item.qty).toLocaleString('pt-BR')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-8 bg-card border-l-4 border-ac text-black px-6 py-4 text-[0.85rem] rounded-sm z-[400] shadow-xl max-w-[280px] border border-border"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({ product, onAdd, onQuickView, onCompare, isComparing }: any) {
  return (
    <div className={`bg-card p-6 group relative overflow-hidden transition-colors border border-border shadow-sm hover:shadow-md ${isComparing ? 'bg-ac/5 border-ac' : 'hover:bg-[#f9f9f9]'}`}>
      {/* Energy Labels */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1 bg-[#f5f5f5] px-1.5 py-0.5 rounded-sm border border-border">
          <Fuel className={`w-3 h-3 ${getGradeColor(product.fuel)}`} />
          <span className="text-[0.65rem] font-bold text-black">{product.fuel}</span>
        </div>
        <div className="flex items-center gap-1 bg-[#f5f5f5] px-1.5 py-0.5 rounded-sm border border-border">
          <Droplets className={`w-3 h-3 ${getGradeColor(product.rain)}`} />
          <span className="text-[0.65rem] font-bold text-black">{product.rain}</span>
        </div>
        <div className="flex items-center gap-1 bg-[#f5f5f5] px-1.5 py-0.5 rounded-sm border border-border">
          <Volume2 className={`w-3 h-3 ${getNoiseColor(product.noise)}`} />
          <span className="text-[0.65rem] font-bold text-black">{product.noise}db</span>
        </div>
      </div>

      {/* Compare Icon */}
      <button 
        onClick={(e) => { e.stopPropagation(); onCompare(product); }}
        className={`absolute top-4 right-4 z-10 p-2 rounded-sm border transition-all ${isComparing ? 'bg-ac text-black border-ac opacity-100' : 'bg-white border-border opacity-0 group-hover:opacity-100 hover:bg-ac hover:text-black'}`}
      >
        <ArrowLeftRight className="w-4 h-4" />
      </button>

      <div className="w-full h-[180px] flex items-center justify-center mb-5 overflow-hidden rounded-sm bg-gray-50 relative">
        <img 
          src={product.image} 
          alt={`${product.brand} ${product.size}`} 
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <button 
          onClick={() => onQuickView(product)}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold text-[0.75rem] tracking-widest uppercase backdrop-blur-[2px]"
        >
          Ver Detalhes
        </button>
      </div>
      
      <div className="space-y-1">
        <p className="text-[0.68rem] tracking-[0.2em] uppercase text-ac font-bold">{product.brand}</p>
        <h3 className="font-display text-xl tracking-wider text-black leading-tight">Pneu {product.brand} {product.size}</h3>
        <p className="text-[0.72rem] text-[#777] font-light uppercase tracking-widest">{product.label}</p>
      </div>
      
      <div className="mt-6 flex justify-between items-end">
        <div className="font-display text-2xl tracking-wider text-black">
          R$ {product.price.toLocaleString('pt-BR')}
          <small className="font-sans text-[0.65rem] text-[#777] block font-light leading-tight mt-1">
            12x R$ {Math.ceil(product.price / 12).toLocaleString('pt-BR')} · Valor por unidade
          </small>
        </div>
        <button 
          onClick={() => onAdd(product)}
          className="bg-ac text-black w-10 h-10 rounded-sm font-bold text-xl flex items-center justify-center transition-all hover:bg-ac2 hover:scale-110 shadow-sm"
        >
          +
        </button>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-ac scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="space-y-5">
      <h4 className="text-[0.68rem] tracking-[0.24em] uppercase text-[#777]">{title}</h4>
      <ul className="space-y-3">
        {links.map((l, i) => (
          <li key={i}>
            <a href={l.href} className="text-[#777] no-underline text-[0.85rem] transition-colors hover:text-black">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
