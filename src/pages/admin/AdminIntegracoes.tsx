// Admin Integrações - uses the same component from CEO but now lives under Admin
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Youtube, ShoppingBag, Tag, ExternalLink, Plus, Trash2, Package } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';
import { useYouTubeVideos } from '@/hooks/use-youtube-videos';
import { YouTubeCategoryManager } from '@/components/video/YouTubeCategoryManager';

// We re-export from CEO but need to update the layout
// For simplicity, re-export the existing component
export { default } from '@/pages/ceo/CEOIntegracoes';
