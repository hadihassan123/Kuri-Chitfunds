import { ChitFund } from '@/types/chit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, Coins, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { deleteChit } from '@/lib/chitApi';

interface ChitCardProps {
  chit: ChitFund;
  onDeleted?: (chitId: string) => void;
}

export function ChitCard({ chit, onDeleted }: ChitCardProps) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const getCurrencySymbol = (code: string): string => {
    const symbols: Record<string, string> = {
      INR: '₹', USD: '$', GBP: '£', EUR: '€',
      AED: 'د.إ', SGD: 'S$', AUD: 'A$', CAD: 'C$'
    };
    return symbols[code] || code;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed': return 'bg-muted text-muted-foreground border-muted';
      default: return '';
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${chit.name}"? This permanently deletes the Kuri and its members, draws, and payments. This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteChit(chit.id);
      onDeleted?.(chit.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to delete Kuri');
    } finally {
      setDeleting(false);
    }
  };

  const totalValue = chit.monthlyAmount * chit.totalMembers;
  const progress = chit.status === 'completed'
    ? 100
    : chit.status === 'active'
      ? ((chit.currentMonth - 1) / chit.durationMonths) * 100
      : (chit.members.length / chit.totalMembers) * 100;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{chit.name}</CardTitle>
            <CardDescription className="mt-1">
              {chit.description || 'No description'}
            </CardDescription>
          </div>
          <Badge variant="outline" className={getStatusColor(chit.status)}>
            {chit.status.charAt(0).toUpperCase() + chit.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Monthly</p>
              <p className="font-medium">{getCurrencySymbol(chit.currency)}{chit.monthlyAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Members</p>
              <p className="font-medium">{chit.members.length}/{chit.totalMembers}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">{chit.durationMonths} months</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {chit.status === 'draft' ? 'Members joined' : 'Progress'}
            </span>
            <span className="font-medium">
              {chit.status === 'active'
                ? `Month ${Math.max(1, chit.currentMonth - 1)} of ${chit.durationMonths}`
                : chit.status === 'completed'
                  ? 'Completed'
                  : `${chit.members.length} of ${chit.totalMembers}`
              }
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Total Pot</p>
            <p className="text-lg font-bold text-primary">
              {getCurrencySymbol(chit.currency)}{totalValue.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={deleting}
              onClick={handleDelete}
              aria-label={`Delete ${chit.name}`}
              title="Delete Kuri"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              onClick={() => navigate(`/chit/${chit.id}`)}
            >
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
