import { useState, useEffect } from 'react';
import { Plus, Coins, Users, Trophy, TrendingUp, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChitCard } from '@/components/ChitCard';
import { CreateChitDialog } from '@/components/CreateChitDialog';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { ChitFund, PendingMembership } from '@/types/chit';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [chits, setChits] = useState<ChitFund[]>([]);
  const [pendingMemberships, setPendingMemberships] = useState<PendingMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingMemberId, setClaimingMemberId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadChits = async () => {
    setLoading(true);
    try {
      const data = await api.getChits();
      setChits(data);
    } catch (error) {
      console.error('Failed to load chits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingMemberships = async () => {
    try {
      const data = await api.getPendingMemberships();
      setPendingMemberships(data);
    } catch (error) {
      console.error('Failed to load pending memberships:', error);
    }
  };

  useEffect(() => {
    void Promise.all([loadChits(), loadPendingMemberships()]);
  }, []);

  const handleClaim = async (memberId: string) => {
    setClaimingMemberId(memberId);
    try {
      const claimed = await api.claimMembership(memberId);
      setPendingMemberships(current => current.filter(item => item.memberId !== memberId));
      await loadChits();
      toast({
        title: 'Membership claimed',
        description: `You joined ${claimed.chitName} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Unable to claim membership',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setClaimingMemberId(null);
    }
  };

  const handleDeleted = (chitId: string) => {
    setChits(current => current.filter(chit => chit.id !== chitId));
  };

  const stats = {
    total: chits.length,
    active: chits.filter(c => c.status === 'active').length,
    members: chits.reduce((sum, c) => sum + c.members.length, 0),
    draws: chits.reduce((sum, c) => sum + c.draws.length, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome to ChitFund/Kuri</h1>
              <p className="text-muted-foreground mt-1">
                Digitize your traditional chit funds & kuris for the modern world
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create New Chit
            </Button>
          </div>
        </div>

        {pendingMemberships.length > 0 && (
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Pending Kuri Invitations
              </CardTitle>
              <CardDescription>
                These memberships match your signed-in email. Claim one to access the Kuri as a member.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingMemberships.map((membership) => (
                <div
                  key={membership.memberId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{membership.chitName}</p>
                    <p className="text-sm text-muted-foreground">
                      Member: {membership.memberName} · {membership.email}
                    </p>
                  </div>
                  <Button
                    onClick={() => void handleClaim(membership.memberId)}
                    disabled={claimingMemberId !== null}
                  >
                    {claimingMemberId === membership.memberId ? 'Claiming…' : 'Claim Membership'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chits</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Chit funds/kuris created</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.members}</div>
              <p className="text-xs text-muted-foreground">Across all chits</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draws</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draws}</div>
              <p className="text-xs text-muted-foreground">Winners selected</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : chits.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>No Chit Funds/Kuris Yet</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Create your first digital chit fund/kuri to start managing savings groups
                with members from around the world.
              </CardDescription>
              <Button className="mt-6" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Chit
              </Button>
            </CardHeader>
          </Card>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Chit Funds/Kuris</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chits.map((chit) => (
                <ChitCard key={chit.id} chit={chit} onDeleted={handleDeleted} />
              ))}
            </div>
          </div>
        )}
      </main>

      <CreateChitDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadChits}
      />
    </div>
  );
}
