import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Animated, Dimensions, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Sensor } from './src/types/sensor';
import { EventoOperacional } from './src/types/eventoOperacional';
import { AlertaCritico } from './src/types/alertaCritico';
import { listarSensores, criarSensor } from './src/services/sensorService';
import { listarEventos, criarEvento } from './src/services/eventoService';
import { listarAlertas, criarAlerta } from './src/services/alertaService';

type Aba = 'sensores' | 'eventos' | 'alertas';
const { width } = Dimensions.get('window');

const T = {
  bg: '#07080f',
  surface: '#0e1018',
  card: '#12151f',
  cardHover: '#161a27',
  border: '#1e2235',
  borderAccent: '#252d45',
  cyan: '#00c8ff',
  cyanDark: '#003d4d',
  orange: '#ff5c00',
  orangeDark: '#3d1600',
  green: '#00e5a0',
  greenDark: '#003d2a',
  red: '#ff2d55',
  redDark: '#3d0012',
  yellow: '#ffc200',
  yellowDark: '#3d2e00',
  purple: '#a855f7',
  text: '#eef0f8',
  textSub: '#6b7394',
  textMid: '#9ba3c4',
  mono: 'monospace' as const,
};

/* ─── hooks ─── */
function usePulse(ms = 1400) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: ms, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: ms, useNativeDriver: true }),
    ])).start();
  }, []);
  return a;
}

function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}`;
}

/* ─── atoms ─── */
function Dot({ color, size = 8, pulse = false }: { color: string; size?: number; pulse?: boolean }) {
  const a = usePulse(1000);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  return (
    <View style={{ width: size * 2.5, height: size * 2.5, alignItems: 'center', justifyContent: 'center' }}>
      {pulse && <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, transform: [{ scale }], opacity }} />}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: color + '20', borderWidth: 1, borderColor: color + '55' }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color, letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

function Bar({ pct, color, height = 3 }: { pct: number; color: string; height?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: Math.min(pct, 100), duration: 900, useNativeDriver: false }).start(); }, [pct]);
  const w = a.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height, backgroundColor: T.border, borderRadius: height, overflow: 'hidden', marginTop: 6 }}>
      <Animated.View style={{ height, width: w, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

function Ring({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const stroke = 4, r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: Math.min(pct, 100), duration: 1000, useNativeDriver: false }).start(); }, [pct]);
  const segments = 20;
  const filled = Math.round((pct / 100) * segments);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const cx = size / 2 + (r + stroke / 2) * Math.cos(rad);
        const cy = size / 2 + (r + stroke / 2) * Math.sin(rad);
        return (
          <View key={i} style={{ position: 'absolute', width: 3, height: 3, borderRadius: 1.5, backgroundColor: i < filled ? color : T.border, left: cx - 1.5, top: cy - 1.5 }} />
        );
      })}
      <Text style={{ fontFamily: T.mono, fontSize: size * 0.22, color, fontWeight: '700' }}>{Math.round(pct)}%</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: T.border, marginVertical: 12 }} />;
}

function Label({ children }: { children: string }) {
  return <Text style={{ fontSize: 9, color: T.textSub, letterSpacing: 2, fontWeight: '600', marginBottom: 3 }}>{children}</Text>;
}

function Val({ children, color, mono }: { children: any; color?: string; mono?: boolean }) {
  return <Text style={{ fontSize: 13, fontWeight: '600', color: color ?? T.text, fontFamily: mono ? T.mono : undefined }}>{children}</Text>;
}

/* ─── cards ─── */
function SensorCard({ s }: { s: Sensor }) {
  const online = s.status?.toUpperCase() === 'ATIVO';
  const c = online ? T.green : T.red;
  const pct = Math.min(Math.abs(s.leituraAtual ?? 0) % 101, 100);
  return (
    <View style={[card.wrap, { borderColor: online ? T.green + '30' : T.border }]}>
      <View style={card.row}>
        <Dot color={c} pulse={online} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={card.title}>{s.nome}</Text>
          <Text style={card.sub}>ID {String(s.id).padStart(4, '0')} · {s.tipo}</Text>
        </View>
        <Tag label={s.status?.toUpperCase()} color={c} />
      </View>
      <Divider />
      <View style={card.metrics}>
        <View style={card.metric}>
          <Label>LEITURA</Label>
          <Text style={{ fontSize: 22, fontWeight: '700', fontFamily: T.mono, color: T.orange }}>
            {s.leituraAtual ?? '—'}<Text style={{ fontSize: 11, color: T.textSub }}> {s.unidade}</Text>
          </Text>
        </View>
        <Ring pct={pct} color={c} size={54} />
      </View>
      <Bar pct={pct} color={c} />
    </View>
  );
}

function EventoCard({ e, last }: { e: EventoOperacional; last: boolean }) {
  const c = e.status?.toUpperCase() === 'CONCLUIDO' ? T.green : e.status?.toUpperCase() === 'FALHA' ? T.red : T.yellow;
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center', paddingTop: 18 }}>
        <Dot color={c} size={6} />
        {!last && <View style={{ flex: 1, width: 1, backgroundColor: T.border, marginTop: 6 }} />}
      </View>
      <View style={[card.wrap, { flex: 1, marginBottom: last ? 0 : 10 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Label>{e.tipo?.toUpperCase() || 'EVENTO'}</Label>
            <Text style={card.title}>{e.descricao}</Text>
          </View>
          <Tag label={e.status?.toUpperCase()} color={c} />
        </View>
        <Divider />
        <View style={card.metrics}>
          <View style={card.metric}>
            <Label>SISTEMA</Label>
            <Val color={T.cyan} mono>{e.sistema}</Val>
          </View>
          <View style={card.metric}>
            <Label>DATA</Label>
            <Val mono>{e.dataHora?.slice(0, 10) || '—'}</Val>
          </View>
        </View>
      </View>
    </View>
  );
}

function AlertaCard({ a }: { a: AlertaCritico }) {
  const isCrit = a.nivel?.toUpperCase() === 'CRITICO';
  const c = isCrit ? T.red : a.nivel?.toUpperCase() === 'ALTO' ? T.orange : a.nivel?.toUpperCase() === 'MEDIO' ? T.yellow : T.green;
  const pulse = usePulse(800);
  const borderOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });
  const levels = ['BAIXO', 'MEDIO', 'ALTO', 'CRITICO'];
  const idx = levels.indexOf(a.nivel?.toUpperCase());
  return (
    <Animated.View style={[card.wrap, { borderColor: isCrit ? c : T.border, borderWidth: 1, opacity: 1 },
      isCrit && { borderColor: c, shadowColor: c, shadowOpacity: 0.3, shadowRadius: 10 }]}>
      {isCrit && <Animated.View style={{ position: 'absolute', inset: 0, borderRadius: 10, borderWidth: 1, borderColor: c, opacity: borderOpacity }} />}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {isCrit && <Dot color={c} size={7} pulse />}
          <Text style={[card.title, { color: c, flex: 1 }]}>{a.titulo}</Text>
        </View>
        <Tag label={a.nivel?.toUpperCase()} color={c} />
      </View>
      <View style={{ flexDirection: 'row', gap: 2, marginVertical: 10 }}>
        {levels.map((l, i) => (
          <View key={l} style={{ flex: 1, height: 4, borderRadius: 2,
            backgroundColor: i <= idx ? (i === 3 ? T.red : i === 2 ? T.orange : i === 1 ? T.yellow : T.green) : T.border }} />
        ))}
      </View>
      <Text style={{ fontSize: 13, color: T.textMid, lineHeight: 19, marginBottom: 10 }}>{a.descricao}</Text>
      <Divider />
      <View style={card.metrics}>
        <View style={card.metric}>
          <Label>DATA/HORA</Label>
          <Val mono>{a.dataHora?.slice(0, 16)?.replace('T', ' ') || '—'}</Val>
        </View>
        <View style={card.metric}>
          <Label>SITUAÇÃO</Label>
          <Val color={a.resolvido ? T.green : T.red}>{a.resolvido ? 'RESOLVIDO' : 'EM ABERTO'}</Val>
        </View>
      </View>
    </Animated.View>
  );
}

const card = StyleSheet.create({
  wrap: { backgroundColor: T.card, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: T.text },
  sub: { fontSize: 10, color: T.textSub, fontFamily: T.mono, marginTop: 1 },
  metrics: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  metric: { flex: 1 },
});

/* ─── form field ─── */
function Field({ label, value, onChange, placeholder, keyboard }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 9, color: T.cyan, letterSpacing: 2, fontWeight: '700', marginBottom: 6 }}>{label}</Text>
      <TextInput style={{ backgroundColor: T.surface, borderRadius: 8, padding: 12, color: T.text,
        borderWidth: 1, borderColor: T.border, fontSize: 14 }}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={T.textSub} keyboardType={keyboard || 'default'} />
    </View>
  );
}

/* ─── main ─── */
export default function App() {
  const [aba, setAba] = useState<Aba>('sensores');
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [eventos, setEventos] = useState<EventoOperacional[]>([]);
  const [alertas, setAlertas] = useState<AlertaCritico[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const clock = useClock();
  const tabX = useRef(new Animated.Value(0)).current;

  const [ns, setNs] = useState({ nome: '', tipo: '', status: 'ATIVO', leituraAtual: '', unidade: '' });
  const [ne, setNe] = useState({ descricao: '', sistema: '', dataHora: '', tipo: '', status: 'PENDENTE' });
  const [na, setNa] = useState({ titulo: '', descricao: '', nivel: 'MEDIO', dataHora: '', resolvido: false });

  useEffect(() => { load(); }, [aba]);

  async function load() {
    setLoading(true); setErro(null);
    try {
      if (aba === 'sensores') setSensores(await listarSensores());
      else if (aba === 'eventos') setEventos(await listarEventos());
      else setAlertas(await listarAlertas());
    } catch { setErro('Falha de conexão — verifique o backend em localhost:8080'); }
    finally { setLoading(false); }
  }

  function switchTab(t: Aba) {
    setAba(t);
    const idx = t === 'sensores' ? 0 : t === 'eventos' ? 1 : 2;
    Animated.spring(tabX, { toValue: idx, useNativeDriver: false, friction: 6 }).start();
  }

  async function salvar() {
    try {
      if (aba === 'sensores') { await criarSensor({ ...ns, leituraAtual: parseFloat(ns.leituraAtual) || 0, ativo: true }); setNs({ nome: '', tipo: '', status: 'ATIVO', leituraAtual: '', unidade: '' }); }
      else if (aba === 'eventos') { await criarEvento(ne); setNe({ descricao: '', sistema: '', dataHora: '', tipo: '', status: 'PENDENTE' }); }
      else { await criarAlerta(na); setNa({ titulo: '', descricao: '', nivel: 'MEDIO', dataHora: '', resolvido: false }); }
      setModal(false); load();
    } catch { Alert.alert('Erro', 'Não foi possível salvar.'); }
  }

  const TAB_W = (width - 40) / 3;
  const pillLeft = tabX.interpolate({ inputRange: [0, 1, 2], outputRange: [4, TAB_W + 4, TAB_W * 2 + 4] });
  const ativos = sensores.filter(s => s.ativo).length;
  const criticos = alertas.filter(a => !a.resolvido && a.nivel?.toUpperCase() === 'CRITICO').length;
  const total = sensores.length + eventos.length + alertas.length;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* ── HEADER ── */}
      <SafeAreaView style={s.header}>
        <View style={s.headerInner}>
          <View>
            <Text style={s.headerEyebrow}>◈ CENTRO DE CONTROLE</Text>
            <Text style={s.headerTitle}>Missão Espacial</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={s.clock}>{clock}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Dot color={T.green} size={5} pulse />
              <Text style={{ fontSize: 9, color: T.green, letterSpacing: 1, fontWeight: '700' }}>ONLINE</Text>
            </View>
          </View>
        </View>

        {/* summary strip */}
        <View style={s.strip}>
          {[
            { label: 'REGISTROS', val: total, color: T.cyan },
            { label: 'ATIVOS', val: ativos, color: T.green },
            { label: 'CRÍTICOS', val: criticos, color: T.red },
          ].map(({ label, val, color }) => (
            <View key={label} style={s.stripItem}>
              <Text style={[s.stripVal, { color }]}>{val}</Text>
              <Text style={s.stripLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>

      {/* ── CONTENT ── */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 120 }}>
        {loading && (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 10 }}>
            <LoadingDots />
            <Text style={{ fontSize: 10, color: T.textSub, letterSpacing: 2 }}>SINCRONIZANDO...</Text>
          </View>
        )}
        {erro && (
          <View style={[card.wrap, { borderColor: T.red + '44', alignItems: 'center', padding: 24 }]}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>⚡</Text>
            <Text style={{ color: T.red, fontWeight: '700', fontSize: 14, marginBottom: 6 }}>FALHA DE CONEXÃO</Text>
            <Text style={{ color: T.textMid, fontSize: 12, textAlign: 'center', lineHeight: 20 }}>{erro}</Text>
            <TouchableOpacity onPress={load} style={{ marginTop: 16, borderWidth: 1, borderColor: T.orange, borderRadius: 6, paddingHorizontal: 20, paddingVertical: 9 }}>
              <Text style={{ color: T.orange, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>RECONECTAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !erro && aba === 'sensores' && (
          sensores.length === 0
            ? <Empty />
            : sensores.map(s => <SensorCard key={s.id} s={s} />)
        )}
        {!loading && !erro && aba === 'eventos' && (
          eventos.length === 0
            ? <Empty />
            : <View style={{ gap: 0 }}>
                {eventos.map((e, i) => <EventoCard key={e.id} e={e} last={i === eventos.length - 1} />)}
              </View>
        )}
        {!loading && !erro && aba === 'alertas' && (
          alertas.length === 0
            ? <Empty />
            : alertas.map(a => <AlertaCard key={a.id} a={a} />)
        )}
      </ScrollView>

      {/* ── FLOATING TAB BAR ── */}
      <View style={s.tabBarWrap}>
        <View style={s.tabBar}>
          <Animated.View style={[s.tabPill, { width: TAB_W - 8, left: pillLeft }]} />
          {(['sensores', 'eventos', 'alertas'] as Aba[]).map(t => (
            <TouchableOpacity key={t} style={[s.tab, { width: TAB_W }]} onPress={() => switchTab(t)} activeOpacity={0.7}>
              <Text style={s.tabIcon}>{t === 'sensores' ? '◈' : t === 'eventos' ? '◎' : '⚡'}</Text>
              <Text style={[s.tabLabel, aba === t && s.tabLabelOn]}>
                {t === 'sensores' ? 'Sensores' : t === 'eventos' ? 'Eventos' : 'Alertas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── FAB ── */}
      <TouchableOpacity style={s.fab} onPress={() => setModal(true)} activeOpacity={0.85}>
        <Text style={s.fabText}>＋</Text>
      </TouchableOpacity>

      {/* ── MODAL ── */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Text style={m.icon}>{aba === 'sensores' ? '◈' : aba === 'eventos' ? '◎' : '⚡'}</Text>
              <Text style={m.title}>
                {aba === 'sensores' ? 'NOVO SENSOR' : aba === 'eventos' ? 'NOVO EVENTO' : 'NOVO ALERTA'}
              </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {aba === 'sensores' && (<>
                <Field label="IDENTIFICAÇÃO" value={ns.nome} onChange={(v: string) => setNs({...ns,nome:v})} placeholder="Nome do sensor" />
                <Field label="TIPO" value={ns.tipo} onChange={(v: string) => setNs({...ns,tipo:v})} placeholder="Ex: TEMPERATURA" />
                <Field label="STATUS" value={ns.status} onChange={(v: string) => setNs({...ns,status:v})} placeholder="ATIVO / INATIVO" />
                <Field label="LEITURA ATUAL" value={ns.leituraAtual} onChange={(v: string) => setNs({...ns,leituraAtual:v})} placeholder="Valor numérico" keyboard="numeric" />
                <Field label="UNIDADE" value={ns.unidade} onChange={(v: string) => setNs({...ns,unidade:v})} placeholder="°C, bar, km/h..." />
              </>)}
              {aba === 'eventos' && (<>
                <Field label="DESCRIÇÃO" value={ne.descricao} onChange={(v: string) => setNe({...ne,descricao:v})} placeholder="Descrição do evento" />
                <Field label="SISTEMA" value={ne.sistema} onChange={(v: string) => setNe({...ne,sistema:v})} placeholder="Ex: PROPULSÃO" />
                <Field label="DATA/HORA" value={ne.dataHora} onChange={(v: string) => setNe({...ne,dataHora:v})} placeholder="2026-05-27T10:00:00" />
                <Field label="TIPO" value={ne.tipo} onChange={(v: string) => setNe({...ne,tipo:v})} placeholder="Ex: INICIALIZACAO" />
                <Field label="STATUS" value={ne.status} onChange={(v: string) => setNe({...ne,status:v})} placeholder="PENDENTE / CONCLUIDO" />
              </>)}
              {aba === 'alertas' && (<>
                <Field label="TÍTULO" value={na.titulo} onChange={(v: string) => setNa({...na,titulo:v})} placeholder="Título do alerta" />
                <Field label="DESCRIÇÃO" value={na.descricao} onChange={(v: string) => setNa({...na,descricao:v})} placeholder="Detalhes do alerta" />
                <Field label="NÍVEL" value={na.nivel} onChange={(v: string) => setNa({...na,nivel:v})} placeholder="BAIXO / MEDIO / ALTO / CRITICO" />
                <Field label="DATA/HORA" value={na.dataHora} onChange={(v: string) => setNa({...na,dataHora:v})} placeholder="2026-05-27T10:00:00" />
              </>)}
              <TouchableOpacity style={m.saveBtn} onPress={salvar} activeOpacity={0.8}>
                <Text style={m.saveTxt}>REGISTRAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setModal(false)}>
                <Text style={m.cancelTxt}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Empty() {
  return (
    <View style={{ alignItems: 'center', paddingTop: 70, gap: 8 }}>
      <Text style={{ fontSize: 36 }}>🛰</Text>
      <Text style={{ color: T.textSub, fontSize: 13, letterSpacing: 0.5 }}>Nenhum registro encontrado</Text>
      <Text style={{ color: T.textSub + '80', fontSize: 11 }}>Toque em + para adicionar</Text>
    </View>
  );
}

function LoadingDots() {
  const a1 = usePulse(600), a2 = usePulse(700), a3 = usePulse(800);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[a1, a2, a3].map((a, i) => (
        <Animated.View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: T.cyan, opacity: a }} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 },
  headerEyebrow: { fontSize: 9, color: T.cyan, letterSpacing: 2.5, fontWeight: '700', marginBottom: 3 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: T.text, letterSpacing: 0.5 },
  clock: { fontFamily: T.mono, fontSize: 14, color: T.cyan, letterSpacing: 2 },
  strip: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: T.border },
  stripItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRightWidth: 1, borderRightColor: T.border },
  stripVal: { fontSize: 20, fontWeight: '800', fontFamily: T.mono },
  stripLabel: { fontSize: 8, color: T.textSub, letterSpacing: 1.5, marginTop: 1 },
  tabBarWrap: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  tabBar: { flexDirection: 'row', backgroundColor: T.surface, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: T.border, position: 'relative', alignItems: 'center' },
  tabPill: { position: 'absolute', height: 38, backgroundColor: T.cardHover, borderRadius: 12, borderWidth: 1, borderColor: T.borderAccent },
  tab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 7, gap: 2, zIndex: 1 },
  tabIcon: { fontSize: 13, color: T.textSub },
  tabLabel: { fontSize: 10, color: T.textSub, fontWeight: '600', letterSpacing: 0.5 },
  tabLabelOn: { color: T.text },
  fab: { position: 'absolute', bottom: 86, right: 20, width: 48, height: 48, borderRadius: 14, backgroundColor: T.orange, alignItems: 'center', justifyContent: 'center', shadowColor: T.orange, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10 },
  fabText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, maxHeight: '90%', borderTopWidth: 1, borderColor: T.borderAccent },
  handle: { width: 36, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  icon: { fontSize: 20, color: T.cyan },
  title: { fontSize: 12, fontWeight: '800', color: T.text, letterSpacing: 3 },
  saveBtn: { backgroundColor: T.orange, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  saveTxt: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 2 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelTxt: { color: T.textSub, fontSize: 13 },
});
