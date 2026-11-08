import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider, SliderTrack, SliderRange, SliderThumb } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";

/**
 * The canonical demo sample app (Brief #3 §8 / Addendum §A1.9a).
 * Fixed DOM — identity switches are token transitions only, never DOM changes.
 */
export function DemoApp() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border-(length:--border-width) border-border bg-card p-5 text-card-foreground">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>
          <span className="font-display text-lg">Acme</span>
          <Badge>Pro</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm">Save</Button>
          <Button size="sm" variant="ghost">
            Discard
          </Button>
        </div>
      </header>
      <Input placeholder="Search records…" aria-label="Search records" />
      <Card>
        <CardHeader>
          <CardTitle>Monthly active users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-display text-4xl">48,201</p>
          <p className="mt-1 text-sm text-muted-foreground">+12% vs last month</p>
        </CardContent>
      </Card>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detail">Detail</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="flex items-center gap-4 pt-2">
          <Toggle aria-label="Notifications">Alerts</Toggle>
          <Slider defaultValue={[40]} max={100} step={1} className="flex-1" aria-label="Threshold">
            <SliderTrack>
              <SliderRange />
            </SliderTrack>
            <SliderThumb aria-label="Threshold value" />
          </Slider>
        </TabsContent>
        <TabsContent value="detail">Per-region breakdown lives here.</TabsContent>
      </Tabs>
    </div>
  );
}
