import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider, SliderTrack, SliderRange, SliderThumb } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * The canonical demo sample app (Brief #3 §8 / Addendum §A1.9a).
 * Fixed DOM — identity switches are token transitions only, never DOM changes.
 */
export function DemoApp() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border-(length:--border-width) border-border bg-card p-5 text-card-foreground">
      <header className="flex items-center justify-between gap-3">
        <span className="font-display text-lg">Acme</span>
        <div className="flex gap-2">
          <Button size="sm">Save</Button>
          <Button size="sm" variant="ghost">Discard</Button>
        </div>
      </header>
      <Input placeholder="Search records…" aria-label="Search records" />
      <div className="rounded-lg border-(length:--border-width) border-border bg-background p-4 text-foreground">
        <p className="text-sm font-medium">Monthly active users</p>
        <p className="font-display text-4xl">48,201</p>
        <p className="mt-1 text-sm text-muted-foreground">+12% vs last month</p>
      </div>
      <ToggleGroup type="single" defaultValue="overview" aria-label="View">
        <ToggleGroupItem value="overview">Overview</ToggleGroupItem>
        <ToggleGroupItem value="detail">Detail</ToggleGroupItem>
      </ToggleGroup>
      <div className="flex items-center gap-4">
        <Toggle aria-label="Notifications">Alerts</Toggle>
        <Slider defaultValue={[40]} max={100} step={1} className="flex-1" aria-label="Threshold">
          <SliderTrack>
            <SliderRange />
          </SliderTrack>
          <SliderThumb aria-label="Threshold" />
        </Slider>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="demo-digest">Weekly digest</Label>
        <Switch id="demo-digest" defaultChecked />
      </div>
    </div>
  );
}