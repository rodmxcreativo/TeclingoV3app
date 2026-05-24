/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Logro } from '../components/logrosSchema';
import { getAll, getById, create, update, remove } from '../services/sheetService';

// Dummy exports for backward compatibility (components that import db/auth)
export const db = null as any;
export const auth = { currentUser: null, onAuthStateChanged: () => () => {} } as any;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Sheet API Error:', { error, operationType, path });
  throw new Error(error instanceof Error ? error.message : String(error));
}

// --- Types ---
type Theme = 'dark' | 'light' | 'normal';
type Language = 'es' | 'en';

interface Event {
  id: string;
  day: number;
  title: string;
  type: 'SCHOOL' | 'HOLIDAY' | 'TECLINGO';
  description: string;
  time?: string;
  visibility: ('GLOBAL' | 'DOCENTE' | 'ALUMNO')[];
}

type UserRole = 'DIRECTOR' | 'DOCENTE' | 'ALUMNO' | 'TUTOR' | 'SUPERADMIN';

export interface Group {
  id: string;
  name: string;
  level: string;
  teacherId: string;
  studentIds: string[];
  schedule: string;
  time: string;
  days: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  isDirector?: boolean;
}

export interface ChatThread {
  id: string;
  name: string;
  type: 'GROUP' | 'DIRECT' | 'GLOBAL' | 'CHANNEL';
  communityId?: string;
  participants: string[];
  messages: Message[];
  lastMessage?: string;
  unreadCount: number;
}

export interface Community {
  id: string;
  name: string;
  type: 'INSTITUTION' | 'CAREER';
  channels: ChatThread[];
}

export interface FolioSignature {
  teacherId: string;
  teacherName: string;
  signatureData: string; // Base64 signature
  timestamp: string;
}

export interface FolioEvidence {
  teacherId: string;
  teacherName: string;
  fileName: string;
  fileUrl: string;
  timestamp: string;
}

export interface Folio {
  id: string;
  title: string;
  subject: string;
  content: string;
  date: string;
  senderName: string;
  assignedToIds: string[]; // Teacher IDs
  signatures: FolioSignature[];
  evidence: FolioEvidence[];
  status: 'PENDING' | 'COMPLETED';
  metadata?: {
    type: string;
    agreements?: any[];
    signaturePos?: { x: number; y: number };
    stampPos?: { x: number; y: number };
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  curp: string;
  employeeId?: string;
  phone: string;
  birthDate?: string;
  avatar?: string;
  bio?: string;
  specialty?: string;
  experience?: string;
  certifications?: { id: string; name: string; type: string; url: string }[];
  institutionId?: string;
  courseLicenseCode?: string;
  controlNumber?: string;
  career?: string;
  module?: number;
  semester?: string;
  group?: string;
  role?: 'DIRECTOR' | 'DOCENTE' | 'ALUMNO' | 'SUPERADMIN';
  hasAcceptedTerms?: boolean;
  termsAcceptedAt?: string;
  termsAcceptedIp?: string;
  isSuperAdmin?: boolean;
  registeredAt?: string;
}

export interface Institution {
  id: string;
  name: string;
  directorId: string;
  registrationCode: string;
  codeExpirationDate?: string;
  isRegistrationActive: boolean;
  createdAt: string;
  licenseStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
}

interface AppContextType {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  userProgress: number;
  setUserProgress: (progress: number) => void;
  globalEvents: Event[];
  addGlobalEvent: (event: Event) => void;
  updateGlobalEvent: (event: Event) => void;
  deleteGlobalEvent: (id: string) => void;
  groups: Group[];
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  communities: Community[];
  chats: ChatThread[];
  addMessage: (chatId: string, message: Message) => void;
  addChannelMessage: (communityId: string, channelId: string, message: Message) => void;
  createGroupChat: (groupId: string, name: string, participants: string[]) => void;
  folios: Folio[];
  addFolio: (folio: Folio) => void;
  signFolio: (folioId: string, signature: FolioSignature) => void;
  addFolioEvidence: (folioId: string, evidence: FolioEvidence) => void;
  completeFolio: (folioId: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  institutionName: string;
  setInstitutionName: (name: string) => void;
  institutionLogo: string;
  setInstitutionLogo: (logo: string) => void;
  institutionLogoSEP: string;
  setInstitutionLogoSEP: (logo: string) => void;
  institutionLogoTecNM: string;
  setInstitutionLogoTecNM: (logo: string) => void;
  institutionSignature: string;
  setInstitutionSignature: (sig: string) => void;
  institutionStamp: string;
  setInstitutionStamp: (stamp: string) => void;
  institutionSlogan: string;
  setInstitutionSlogan: (slogan: string) => void;
  institutionAddress: string;
  setInstitutionAddress: (address: string) => void;
  institutionPhone: string;
  setInstitutionPhone: (phone: string) => void;
  quickChatUser: any | null;
  setQuickChatUser: (user: any | null) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (mode: boolean) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  validateInstitutionId: (id: string) => Promise<Institution | null>;
  validateCourseLicense: (code: string) => Promise<boolean>;
  currentInstitution: Institution | null;
  acceptTerms: (ip: string) => Promise<void>;
  logActivity: (type: string, data: any) => Promise<void>;
  logros: Logro[];
  addLogro: (logro: Logro) => void;
}

const mockEvents: Event[] = [
  { id: '1', day: 15, title: 'Examen Global A1', type: 'SCHOOL', description: 'Evaluación final del primer bloque de Basic English.', time: '08:00 AM', visibility: ['GLOBAL'] },
  { id: '2', day: 20, title: 'Día de la Revolución', type: 'HOLIDAY', description: 'Suspensión de labores académicas por fecha oficial.', time: 'Todo el día', visibility: ['GLOBAL'] },
  { id: '3', day: 22, title: 'AI Workshop: Prompt Engineering', type: 'TECLINGO', description: 'Taller presencial sobre el uso de la IA en la creación de prompts para aprendizaje de idiomas.', time: '04:00 PM', visibility: ['ALUMNO', 'DOCENTE'] },
  { id: '4', day: 25, title: 'Lanzamiento: Album AR Linguistic', type: 'TECLINGO', description: 'Evento especial con realidad aumentada para la presentación de nuevo material auditivo.', time: '06:00 PM', visibility: ['GLOBAL'] },
  { id: '5', day: 10, title: 'Junta de Docentes', type: 'SCHOOL', description: 'Reunión de coordinación pedagógica ciclo 2026-A.', time: '01:00 PM', visibility: ['DOCENTE'] },
];

const translations = {
  es: {
    dashboard: 'Panel de Control',
    settings: 'Configuración',
    language: 'Idioma',
    theme: 'Tema',
    profile: 'Mi Perfil',
    adn: 'Mi ADN',
    skills: 'Habilidades',
    normal: 'Normal',
    dark: 'Oscuro',
    light: 'Claro',
    english: 'Inglés',
    spanish: 'Español',
    welcome: '¡Hola!',
    progress: 'Progreso',
    new: 'NUEVO',
    logout: 'Cerrar Sesión',
    back: 'Volver',
    my_dashboard: 'Mi Dashboard',
    progress_map: 'Mapa de Progreso',
    ai_support: 'Soporte AI',
    pdp: 'Habilidades (PDP)',
    my_group: 'Mi Grupo',
    tasks: 'Tareas / Exámenes',
    grades: 'Calificaciones',
    calendar: 'Mi Calendario',
    folios: 'Mis Folios',
    messages: 'Mis Mensajes',
    achievements: 'Logros',
    library: 'Biblioteca'
  },
  en: {
    dashboard: 'Dashboard',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    profile: 'Profile',
    adn: 'My ADN',
    skills: 'Skills',
    normal: 'Normal',
    dark: 'Dark',
    light: 'Light',
    english: 'English',
    spanish: 'Spanish',
    welcome: 'Hello!',
    progress: 'Progress',
    new: 'NEW',
    logout: 'Logout',
    back: 'Back',
    my_dashboard: 'My Dashboard',
    progress_map: 'Progress Map',
    ai_support: 'AI Support',
    pdp: 'Skills (PDP)',
    my_group: 'My Group',
    tasks: 'Tasks / Exams',
    grades: 'Grades',
    calendar: 'My Calendar',
    folios: 'My Folios',
    messages: 'My Messages',
    achievements: 'Achievements',
    library: 'Library'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => (localStorage.getItem('tecnolingo_session') as UserRole) || 'DIRECTOR');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'es');
  const [userProgress, setUserProgress] = useState(75);
  const [globalEvents, setGlobalEvents] = useState<Event[]>(mockEvents);
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 'GRP-001',
      name: 'Pioneers A1 - Morning',
      level: 'A1 - Beginner',
      teacherId: 'USR-901-B33',
      studentIds: ['USR-001-A22', 'USR-221-C99'],
      schedule: '08:00 - 10:00',
      time: '08:00 AM',
      days: ['LUN', 'MIÉ', 'VIE'],
      status: 'ACTIVE'
    }
  ]);
  const [communities, setCommunities] = useState<Community[]>([
    {
      id: 'COM-ITSP',
      name: 'Comunidad ITSP',
      type: 'INSTITUTION',
      channels: [
        {
          id: 'CHAN-GEN',
          name: 'General 🌐',
          type: 'CHANNEL',
          communityId: 'COM-ITSP',
          participants: [],
          messages: [
            { id: 'm1', content: 'Bienvenidos al canal general de la institución.', senderId: 'DIR-001', senderName: 'Dirección', senderRole: 'DIRECTOR', timestamp: '08:00 AM', isDirector: true }
          ],
          unreadCount: 0
        },
        {
          id: 'CHAN-ACAD',
          name: 'Academias 📚',
          type: 'CHANNEL',
          communityId: 'COM-ITSP',
          participants: [],
          messages: [],
          unreadCount: 0
        }
      ]
    },
    {
      id: 'COM-SISTEMAS',
      name: 'Ingeniería en Sistemas',
      type: 'CAREER',
      channels: [
        {
          id: 'CHAN-SIS-GEN',
          name: 'Anuncios Carrera',
          type: 'CHANNEL',
          communityId: 'COM-SISTEMAS',
          participants: [],
          messages: [],
          unreadCount: 0
        },
        {
          id: 'CHAN-SIS-FOLIOS',
          name: 'Repositorio de Folios 📂',
          type: 'CHANNEL',
          communityId: 'COM-SISTEMAS',
          participants: [],
          messages: [],
          unreadCount: 0
        }
      ]
    }
  ]);
  const [chats, setChats] = useState<ChatThread[]>([
    {
      id: 'CHAT-GLOBAL',
      name: 'Difusión Institucional',
      type: 'GLOBAL',
      participants: [],
      messages: [
        { id: '1', senderId: 'DIR-001', senderName: 'Dirección', senderRole: 'DIRECTOR', content: 'Bienvenidos al ciclo 2026-A.', timestamp: '10:00 AM', isDirector: true }
      ],
      unreadCount: 0
    },
    {
      id: 'GRP-001',
      name: 'Pioneers A1 - Morning (Grupo)',
      type: 'GROUP',
      participants: ['USR-901-B33', 'USR-001-A22', 'USR-221-C99'],
      messages: [],
      unreadCount: 0
    }
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [folios, setFolios] = useState<Folio[]>([
    {
      id: 'FOL-2026-042',
      title: 'Circular Informativa 042',
      subject: 'Protocolo de Evaluación Verano',
      content: 'Estimados docentes, se les recuerda que a partir del próximo ciclo el porcentaje de evidencia diaria impactará en el 15% del KPI Operativo...',
      date: '12 MAY, 2026',
      senderName: 'Dirección Central',
      assignedToIds: ['USR-901-B33'],
      signatures: [],
      evidence: [],
      status: 'PENDING'
    }
  ]);

  const addFolio = (folio: Folio) => {
    setFolios(prev => [folio, ...prev]);
  };

  const signFolio = (folioId: string, signature: FolioSignature) => {
    setFolios(prev => prev.map(f => {
      if (f.id === folioId) {
        return {
          ...f,
          signatures: [...f.signatures, signature]
        };
      }
      return f;
    }));
  };

  const addFolioEvidence = (folioId: string, item: FolioEvidence) => {
    setFolios(prev => prev.map(f => {
      if (f.id === folioId) {
        return {
          ...f,
          evidence: [...f.evidence, item]
        };
      }
      return f;
    }));
  };

  const completeFolio = (folioId: string) => {
    setFolios(prev => prev.map(f => f.id === folioId ? { ...f, status: 'COMPLETED' } : f));
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [logros, setLogros] = useState<Logro[]>(() => {
    const cached = localStorage.getItem('tecnolingo_logros');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'init-1',
        idAlumno: '1',
        nombreAlumno: 'Martha S.',
        titulo: "The Bridge: Elite Pronunciation",
        metrica: "Nivel 10",
        icon: "🎙️",
        color: "from-amber-500 to-orange-600",
        puntos: 12,
        subtitulo: "98% precisión vocal",
        categoria: 'Academico',
        fechaAsignado: "22/05/2026",
        mentor: "Prof. Guerrero",
        evidenciaDocente: "Validación vocal perfecta en módulo de pasatiempos de la sesión síncrona."
      },
      {
        id: 'init-2',
        idAlumno: '1',
        nombreAlumno: 'Martha S.',
        titulo: "Streak: Burning Flame",
        metrica: "Legendario",
        icon: "🔥",
        color: "from-red-500 to-pink-600",
        puntos: 12,
        subtitulo: "Interacción consecutiva IA",
        categoria: 'Constancia',
        fechaAsignado: "18/05/2026",
        mentor: "Sistema Autogestionado",
        evidenciaDocente: "21 días consecutivos interactuando con los agentes académicos del Hub."
      },
      {
        id: 'init-3',
        idAlumno: '1',
        nombreAlumno: 'Martha S.',
        titulo: "Zero Paper Master",
        metrica: "-92% Papel",
        icon: "🌱",
        color: "from-emerald-500 to-teal-600",
        puntos: 12,
        subtitulo: "Reducción de huella de carbono",
        categoria: 'Ecologico',
        fechaAsignado: "10/05/2026",
        mentor: "Inst. TECLINGO",
        evidenciaDocente: "Cero impresiones físicas durante los bloques 1 a 4. Entrega digital completa."
      },
      {
        id: 'init-4',
        idAlumno: '1',
        nombreAlumno: 'Martha S.',
        titulo: "Grammar Fixer Expert",
        metrica: "Silver Med",
        icon: "✍️",
        color: "from-blue-500 to-indigo-600",
        puntos: 12,
        subtitulo: "100 correcciones aplicadas",
        categoria: 'Academico',
        fechaAsignado: "01/05/2026",
        mentor: "Prof. Guerrero",
        evidenciaDocente: "Resolución del reactivo crítico de error sintáctico sin fallas de ejecución."
      }
    ];
  });

  const addLogro = (logro: Logro) => {
    setLogros(prev => {
      const updated = [logro, ...prev];
      localStorage.setItem('tecnolingo_logros', JSON.stringify(updated));
      return updated;
    });

    try {
      create('logros', logro).catch(err => {
        console.warn("Sheet save failed, using local fallback state", err);
      });
    } catch (err) {
      console.warn("Sheet write block issue", err);
    }
  };

  const [institutionName, setInstitutionName] = useState('TECNOLINGO AI');
  const [institutionLogo, setInstitutionLogo] = useState('https://raw.githubusercontent.com/lucide-react/lucide/main/icons/zap.svg');
  const [institutionLogoSEP, setInstitutionLogoSEP] = useState('https://raw.githubusercontent.com/lucide-react/lucide/main/icons/landmark.svg');
  const [institutionLogoTecNM, setInstitutionLogoTecNM] = useState('https://raw.githubusercontent.com/lucide-react/lucide/main/icons/cpu.svg');
  const [institutionSignature, setInstitutionSignature] = useState('');
  const [institutionStamp, setInstitutionStamp] = useState('');
  const [institutionSlogan, setInstitutionSlogan] = useState('Excelencia en Ciencia, Futuro en la Humanidad');
  const [institutionAddress, setInstitutionAddress] = useState('CON CARRETERA PÁNUCO-TEMPOAL KM. 1.5, PÁNUCO, VERACRUZ. C.P. 93900');
  const [institutionPhone, setInstitutionPhone] = useState('846 266 1100');
  const [quickChatUser, setQuickChatUser] = useState<any | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    const fetchLogros = async () => {
      try {
        const allLogros = await getAll<any>('logros');
        const filtered = (allLogros || []).filter((l: any) => l.idAlumno === currentUser.id);
        if (filtered.length > 0) {
          setLogros(prev => {
            const initialIds = new Set(['init-1', 'init-2', 'init-3', 'init-4']);
            const initials = prev.filter(item => initialIds.has(item.id));
            const others = prev.filter(item => !initialIds.has(item.id));
            
            const all = [...filtered];
            const fetchedIds = new Set(filtered.map((l: any) => l.id));
            others.forEach(l => {
              if (!fetchedIds.has(l.id)) all.push(l);
            });

            const finalMerged = all.length > 0 ? all : initials;
            localStorage.setItem('tecnolingo_logros', JSON.stringify(finalMerged));
            return finalMerged;
          });
        }
      } catch (e) {
        console.warn("Could not fetch logros from Sheet:", e);
      }
    };
    fetchLogros();
  }, [currentUser]);

  // Fetch Institution data if user has one
  useEffect(() => {
    if (currentUser?.institutionId) {
      const fetchInst = async () => {
        try {
          const result = await getById<Institution>('institutions', currentUser.institutionId);
          if (result) {
            setCurrentInstitution(result);
            setInstitutionName(result.name);
          }
        } catch (e) {
          console.warn("Could not fetch institution:", e);
        }
      };
      fetchInst();
    } else {
      setCurrentInstitution(null);
    }
  }, [currentUser?.institutionId]);

  // Test Connection on Boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getAll('users');
        console.log("Google Sheets API connection established.");
      } catch (error) {
        console.warn("Google Sheets API not available, operating in Local Demo Mode:", error);
      }
    }
    testConnection();
  }, []);

  // Fetch User Profile on session/role change
  useEffect(() => {
    const lastSessionRole = (localStorage.getItem('tecnolingo_session') as UserRole) || 'DIRECTOR';
    const storedUser = localStorage.getItem('tecnolingo_current_user');
    
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
        return;
      } catch (e) {
        // ignore
      }
    }

    // Try to load from Sheet API
    const fetchUser = async () => {
      try {
        const users = await getAll<UserProfile>('users');
        const sessionUser = users?.find(u => u.id === `MOCK-USER-123` || u.role === lastSessionRole);
        if (sessionUser) {
          setCurrentUser(sessionUser);
          localStorage.setItem('tecnolingo_current_user', JSON.stringify(sessionUser));
          return;
        }
      } catch (e) {
        console.warn("Could not fetch user from Sheet, using mock:", e);
      }
      
      // Fallback to mock user
      let assignedRole: 'DIRECTOR' | 'DOCENTE' | 'ALUMNO' | 'SUPERADMIN' = 'DIRECTOR';
      if (lastSessionRole === 'SUPERADMIN' || lastSessionRole === 'DOCENTE' || lastSessionRole === 'ALUMNO' || lastSessionRole === 'DIRECTOR') {
        assignedRole = lastSessionRole;
      }
      const mockUserObj: UserProfile = {
        id: 'MOCK-USER-123',
        name: 'Administrador Demo',
        email: 'rodmxcreativo@gmail.com',
        curp: 'XXXX-XXXX-XXXX-0000',
        employeeId: 'DOC-2026-999',
        phone: '+52 000 000 0000',
        birthDate: '1990-01-01',
        avatar: 'https://i.pravatar.cc/150?u=MOCK-USER-123',
        specialty: 'Sistemas de Información',
        experience: 'Gestión y Planeación Curricular',
        bio: 'Usuario del sistema cargado en modo de demostración local temporal.',
        certifications: [],
        role: assignedRole,
        hasAcceptedTerms: true,
      };
      setCurrentUser(mockUserObj);
    };
    fetchUser();
  }, []);

  const saveUserProfile = async (profile: UserProfile) => {
    if (!profile.id) return;
    setCurrentUser(profile);
    localStorage.setItem('tecnolingo_current_user', JSON.stringify(profile));
    try {
      await update('users', profile.id, profile);
    } catch (error) {
      console.warn("Sheet save failed, using local state:", error);
    }
  };

  const validateInstitutionId = async (id: string): Promise<Institution | null> => {
    try {
      const data = await getById<Institution>('institutions', id);
      if (data) {
        const now = new Date().getTime();
        const exp = data.codeExpirationDate ? new Date(data.codeExpirationDate).getTime() : Infinity;
        if (data.isRegistrationActive && now < exp) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error("Institution Validation Error", error);
      return {
        id: id || 'DEMO-INST',
        name: 'Instituto Tecnológico Local (Demo)',
        directorId: 'MOCK-USER-123',
        registrationCode: 'LOCAL-CODE',
        isRegistrationActive: true,
        createdAt: new Date().toISOString(),
        licenseStatus: 'ACTIVE',
      };
    }
  };

  const validateCourseLicense = async (code: string): Promise<boolean> => {
    try {
      const codes = await getAll<any>('activationCodes');
      const valid = (codes || []).find((c: any) => 
        String(c.code).toUpperCase() === code.toUpperCase() && c.status === 'AVAILABLE'
      );
      return !!valid;
    } catch (error) {
      console.error("License Validation Error", error);
      return true; // fallback to allow in demo
    }
  };

  const acceptTerms = async (ip: string) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      hasAcceptedTerms: true,
      termsAcceptedAt: new Date().toISOString(),
      termsAcceptedIp: ip
    };
    setCurrentUser(updated);
    localStorage.setItem('tecnolingo_current_user', JSON.stringify(updated));
    try {
      await update('users', currentUser.id, updated);
    } catch (error) {
      console.warn("Sheet save failed for terms acceptance:", error);
    }
  };

  const logActivity = async (type: string, data: any) => {
    console.log("Log Activity:", type, data);
    try {
      await create('system_logs', {
        type,
        data,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'ANONYMOUS'
      });
    } catch (error) {
      console.error("Logger Error", error);
    }
  };

  useEffect(() => {
    localStorage.setItem('tecnolingo_session', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'normal') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const addGlobalEvent = (event: Event) => {
    setGlobalEvents(prev => [...prev, event]);
  };

  const updateGlobalEvent = (event: Event) => {
    setGlobalEvents(prev => prev.map(e => e.id === event.id ? event : e));
  };

  const deleteGlobalEvent = (id: string) => {
    setGlobalEvents(prev => prev.filter(e => e.id !== id));
  };
  
  const addGroup = (group: Group) => {
    setGroups(prev => [...prev, group]);
    createGroupChat(group.id, `${group.name} (Grupo)`, [group.teacherId, ...group.studentIds]);
  };

  const updateGroup = (group: Group) => {
    setGroups(prev => prev.map(g => g.id === group.id ? group : g));
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    setChats(prev => prev.filter(c => c.id !== id));
  };

  const addMessage = (chatId: string, message: Message) => {
    // Check in flat chats
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, message],
          lastMessage: message.content,
          unreadCount: chat.unreadCount + 1
        };
      }
      return chat;
    }));

    // Also check in communities
    setCommunities(prev => prev.map(comm => ({
      ...comm,
      channels: comm.channels.map(chan => {
        if (chan.id === chatId) {
          return {
            ...chan,
            messages: [...chan.messages, message],
            lastMessage: message.content,
            unreadCount: chan.unreadCount + 1
          };
        }
        return chan;
      })
    })));
  };

  const addChannelMessage = (communityId: string, channelId: string, message: Message) => {
    setCommunities(prev => prev.map(comm => {
      if (comm.id === communityId) {
        return {
          ...comm,
          channels: comm.channels.map(chan => {
            if (chan.id === channelId) {
              return {
                ...chan,
                messages: [...chan.messages, message],
                lastMessage: message.content,
                unreadCount: chan.unreadCount + 1
              };
            }
            return chan;
          })
        };
      }
      return comm;
    }));
  };

  const createGroupChat = (groupId: string, name: string, participants: string[]) => {
    const newChat: ChatThread = {
      id: groupId,
      name,
      type: 'GROUP',
      participants,
      messages: [],
      unreadCount: 0
    };
    setChats(prev => [...prev, newChat]);
  };

  return (
    <AppContext.Provider value={{ 
      theme, 
      language, 
      setTheme, 
      setLanguage, 
      t, 
      userProgress, 
      setUserProgress, 
      globalEvents, 
      addGlobalEvent,
      updateGlobalEvent,
      deleteGlobalEvent,
      groups,
      addGroup,
      updateGroup,
      deleteGroup,
      communities,
      chats,
      addMessage,
      addChannelMessage,
      createGroupChat,
      folios,
      addFolio,
      signFolio,
      addFolioEvidence,
      completeFolio,
      isSidebarOpen,
      setIsSidebarOpen,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      institutionName,
      setInstitutionName,
      institutionLogo,
      setInstitutionLogo,
      institutionLogoSEP,
      setInstitutionLogoSEP,
      institutionLogoTecNM,
      setInstitutionLogoTecNM,
      institutionSignature,
      setInstitutionSignature,
      institutionStamp,
      setInstitutionStamp,
      institutionSlogan,
      setInstitutionSlogan,
      institutionAddress,
      setInstitutionAddress,
      institutionPhone,
      setInstitutionPhone,
      quickChatUser,
      setQuickChatUser,
      maintenanceMode,
      setMaintenanceMode,
      currentRole,
      setCurrentRole,
      currentUser,
      setCurrentUser,
      saveUserProfile,
      validateInstitutionId,
      validateCourseLicense,
      currentInstitution,
      acceptTerms,
      logActivity,
      logros,
      addLogro
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
