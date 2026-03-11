import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, RotateCcw, Upload, Trash2, Plus, X, Search, Filter,
  Image, Palette, Sparkles, LayoutDashboard, Users, Eye, EyeOff, GripVertical,
  Sun, Moon, Video, Crown, Bell, Lightbulb, Navigation
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useWhiteLabel, 
  availableLucideIcons, 
  availableEmojis,
  availableGradientColors,
  availableRoutes,
  defaultQuickActions,
  defaultNavigationTabs,
  IconConfig, 
  IconItem,
  QuickActionItem,
  NavTabConfig
} from '@/contexts/WhiteLabelContext';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

// Re-export the personalization page content but wrapped in AdminLayout
// We import the actual content component from CEO and wrap it
import CEOPersonalizacaoContent from '@/pages/ceo/CEOPersonalizacao';

const AdminPersonalizacao = () => {
  // CEOPersonalizacao already renders its own layout (CEOLayout)
  // We need to render the content inside AdminLayout instead
  // For now, redirect to the standalone component that we'll refactor
  return <CEOPersonalizacaoContent useAdminLayout />;
};

export default AdminPersonalizacao;
