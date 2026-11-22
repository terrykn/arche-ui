#!/usr/bin/env node
/**
 * Generate the docs usage snippets for every component manifest.
 *
 * Import names come from the template's own `export { … }` list, so a snippet
 * can never name a part the shipped file does not export. Composition is
 * curated for shapes whose markup is structural (table, dialog, tabs …) and
 * otherwise built from the root export plus its first few sibling parts.
 *
 * Writes apps/web/components/component-usage.generated.ts.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const manifestDir = join(root, "packages/foundation/src/manifests");
const templateDir = join(root, "packages/foundation/src/templates");
const outFile = join(root, "apps/web/components/component-usage.generated.ts");

const pascal = (value) =>
  value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const manifestNames = readdirSync(manifestDir)
  .filter((file) => file.endsWith(".manifest.json"))
  .map((file) => file.replace(".manifest.json", ""))
  .sort();

/** Template source of one component, for export and signature reads. */
function templateSource(name) {
  return readFileSync(join(templateDir, `${name}.tsx`), "utf8");
}

/** Exported component names, in template order. */
function templateExports(name) {
  const source = templateSource(name);
  const found = [];
  const push = (entry, index) => {
    if (/^[A-Z]/.test(entry) && !found.some((item) => item.name === entry)) {
      found.push({ name: entry, index });
    }
  };
  for (const match of source.matchAll(/export (?:function|const) ([A-Z]\w*)/g)) push(match[1], match.index);
  for (const block of source.matchAll(/export \{([^}]*)\}/g)) {
    for (const entry of block[1].split(",")) push(entry.trim(), block.index);
  }
  return found.sort((a, b) => a.index - b.index).map((item) => item.name);
}

/** Whether the named export renders children (so a snippet can show text). */
function takesChildren(name, exportName) {
  const source = templateSource(name);
  const start = source.search(new RegExp(`(?:function|const) ${exportName}\\b`));
  if (start === -1) return false;
  const signature = source.slice(start, start + 900);
  return /\bchildren\b/.test(signature.split("{")[0]);
}

function importPathFor(manifest) {
  const target = manifest.files?.[0]?.target ?? `components/ui/${manifest.name}.tsx`;
  return `@/${target.replace(/\.tsx$/, "")}`;
}

const CHILD_LABEL = {
  Trigger: "Open",
  Content: "Content",
  Item: "Item",
  List: "List",
  Body: "Body",
  Header: "Header",
  Footer: "Footer",
  Title: "Title",
  Description: "Description",
  Label: "Label",
  Action: "Action",
  Close: "Close",
  Value: "Value",
  Group: "Group",
  Panel: "Panel",
  Cell: "Cell",
  Row: "Row",
  Field: "Field",
};

/**
 * Curated bodies for layouts whose parts only work nested a particular way.
 * Each entry names the imports it uses; the generator drops the snippet when
 * the template no longer exports one of them and falls back to the generic
 * shape, so stale hints surface as a generic example rather than wrong code.
 */
const CURATED = {
  card: ["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "CardFooter"],
  dialog: ["Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogTitle", "DialogDescription"],
  "alert-dialog": ["AlertDialog", "AlertDialogTrigger", "AlertDialogContent", "AlertDialogTitle", "AlertDialogDescription", "AlertDialogAction", "AlertDialogCancel"],
  sheet: ["Sheet", "SheetTrigger", "SheetContent", "SheetHeader", "SheetTitle", "SheetDescription"],
  drawer: ["Drawer", "DrawerTrigger", "DrawerContent", "DrawerHeader", "DrawerTitle", "DrawerDescription"],
  popover: ["Popover", "PopoverTrigger", "PopoverContent"],
  "dropdown-menu": ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem"],
  tabs: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],
  select: ["Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectItem"],
  accordion: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"],
  table: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"],
  toast: ["ToastProvider", "Toast", "ToastTitle", "ToastDescription"],
  combobox: ["Combobox", "ComboboxInput", "ComboboxContent", "ComboboxList", "ComboboxItem"],
  sidebar: ["SidebarProvider", "Sidebar", "SidebarContent", "SidebarInset", "SidebarTrigger"],
  calendar: ["Calendar"],
  input: ["Input"],
  button: ["Button"],
  badge: ["Badge"],
  avatar: ["Avatar", "AvatarImage", "AvatarFallback"],
  textarea: ["Textarea"],
  label: ["Label"],
  switch: ["Switch"],
  checkbox: ["Checkbox"],
  slider: ["Slider", "SliderTrack", "SliderRange", "SliderThumb"],
  progress: ["Progress"],
  separator: ["Separator"],
  skeleton: ["Skeleton"],
  "input-otp": ["InputOTP", "InputOTPGroup", "InputOTPSlot"],
  resizable: ["ResizablePanelGroup", "ResizablePanel", "ResizableHandle"],
  chart: ["ChartContainer", "ChartTooltip", "ChartTooltipContent"],
};

const CURATED_CODE = {
  card: `<Card>
  <CardHeader>
    <CardTitle>Card title</CardTitle>
    <CardDescription>Short supporting line.</CardDescription>
  </CardHeader>
  <CardContent>Body content.</CardContent>
  <CardFooter>Footer content.</CardFooter>
</Card>`,
  dialog: `<Dialog>
  <DialogTrigger>Open dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog title</DialogTitle>
      <DialogDescription>What this dialog is for.</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`,
  "alert-dialog": `<AlertDialog>
  <AlertDialogTrigger>Delete project</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete this project?</AlertDialogTitle>
    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    <AlertDialogAction>Delete</AlertDialogAction>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
  </AlertDialogContent>
</AlertDialog>`,
  sheet: `<Sheet>
  <SheetTrigger>Open sheet</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Sheet title</SheetTitle>
      <SheetDescription>What this sheet is for.</SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>`,
  drawer: `<Drawer>
  <DrawerTrigger>Open drawer</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Drawer title</DrawerTitle>
      <DrawerDescription>What this drawer is for.</DrawerDescription>
    </DrawerHeader>
  </DrawerContent>
</Drawer>`,
  popover: `<Popover>
  <PopoverTrigger>Open popover</PopoverTrigger>
  <PopoverContent>Popover content.</PopoverContent>
</Popover>`,
  "dropdown-menu": `<DropdownMenu>
  <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Sign out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
  tabs: `<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview content.</TabsContent>
  <TabsContent value="activity">Activity content.</TabsContent>
</Tabs>`,
  select: `<Select defaultValue="starter">
  <SelectTrigger>
    <SelectValue placeholder="Pick a plan" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="starter">Starter</SelectItem>
    <SelectItem value="growth">Growth</SelectItem>
  </SelectContent>
</Select>`,
  accordion: `<Accordion>
  <AccordionItem value="shipping">
    <AccordionTrigger>How long is shipping?</AccordionTrigger>
    <AccordionContent>Two to four business days.</AccordionContent>
  </AccordionItem>
</Accordion>`,
  table: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Acme</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
  toast: `<ToastProvider>
  <Toast>
    <ToastTitle>Saved</ToastTitle>
    <ToastDescription>Your changes are live.</ToastDescription>
  </Toast>
</ToastProvider>`,
  combobox: `<Combobox>
  <ComboboxInput placeholder="Search…" />
  <ComboboxContent>
    <ComboboxList>
      <ComboboxItem value="acme">Acme</ComboboxItem>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
  sidebar: `<SidebarProvider>
  <Sidebar>
    <SidebarContent>Navigation.</SidebarContent>
  </Sidebar>
  <SidebarInset>
    <SidebarTrigger />
    Page content.
  </SidebarInset>
</SidebarProvider>`,
  calendar: `<Calendar mode="single" />`,
  input: `<Input placeholder="you@example.com" />`,
  button: `<Button>Save changes</Button>`,
  badge: `<Badge>New</Badge>`,
  avatar: `<Avatar>
  <AvatarImage src="/avatar.png" alt="Maya Chen" />
  <AvatarFallback>MC</AvatarFallback>
</Avatar>`,
  textarea: `<Textarea placeholder="Write a note…" />`,
  label: `<Label htmlFor="email">Email</Label>`,
  switch: `<Switch />`,
  checkbox: `<Checkbox />`,
  slider: `<Slider defaultValue={[50]} max={100}>
  <SliderTrack>
    <SliderRange />
  </SliderTrack>
  <SliderThumb aria-label="Value" />
</Slider>`,
  progress: `<Progress value={60} />`,
  separator: `<Separator />`,
  skeleton: `<Skeleton className="h-4 w-40" />`,
  "input-otp": `<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
</InputOTP>`,
  resizable: `<ResizablePanelGroup orientation="horizontal" className="h-48 rounded-lg border">
  <ResizablePanel>One</ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel>Two</ResizablePanel>
</ResizablePanelGroup>`,
  chart: `<ChartContainer config={{ sales: { label: "Sales", color: "var(--chart-1)" } }}>
  <ChartTooltip content={<ChartTooltipContent />} />
  {/* any recharts chart goes here, e.g. <BarChart data={data}>…</BarChart> */}
</ChartContainer>`,
};

const VOIDISH = new Set(["Input", "Textarea", "Image"]);

function genericSnippet(name, exports, manifest) {
  const exact = exports.find((entry) => entry === pascal(name));
  const prefixed = exports
    .filter((entry) => entry.startsWith(pascal(name)))
    .sort((a, b) => a.length - b.length);
  const rootExport = exact ?? prefixed[0] ?? exports[0];
  const rest = exports.filter((entry) => entry !== rootExport);
  const preferred = ["Trigger", "Content", "Item", "List", "Body", "Header", "Footer", "Title", "Description"];
  const children = [];
  for (const suffix of preferred) {
    const match = rest.find((entry) => entry.endsWith(suffix) && !children.includes(entry));
    if (match) children.push(match);
    if (children.length === 3) break;
  }

  const nativeElement = manifest.native?.element;
  const rootHasChildren = takesChildren(name, rootExport);
  if (children.length === 0) {
    if (VOIDISH.has(rootExport) || nativeElement === "input" || nativeElement === "img" || nativeElement === "hr") {
      return { imports: [rootExport], code: `<${rootExport} placeholder="…" />` };
    }
    if (!rootHasChildren) return { imports: [rootExport], code: `<${rootExport} />` };
    return { imports: [rootExport], code: `<${rootExport}>${manifest.title}</${rootExport}>` };
  }

  const body = children
    .map((child) => {
      const suffix = Object.keys(CHILD_LABEL).find((key) => child.endsWith(key));
      const label = suffix ? CHILD_LABEL[suffix] : child;
      return `  <${child}>${label}</${child}>`;
    })
    .join("\n");
  return {
    imports: [rootExport, ...children],
    code: `<${rootExport}>\n${body}\n</${rootExport}>`,
  };
}

const entries = [];
for (const name of manifestNames) {
  const manifest = JSON.parse(readFileSync(join(manifestDir, `${name}.manifest.json`), "utf8"));
  const exports = templateExports(name);
  if (exports.length === 0) {
    console.warn(`skip ${name}: template exports no component`);
    continue;
  }
  const importPath = importPathFor(manifest);

  let snippet;
  const curatedNames = CURATED[name];
  if (curatedNames && curatedNames.every((entry) => exports.includes(entry)) && CURATED_CODE[name]) {
    snippet = { imports: curatedNames, code: CURATED_CODE[name] };
  } else {
    snippet = genericSnippet(name, exports, manifest);
  }

  const code = `import { ${snippet.imports.join(", ")} } from "${importPath}";\n\n${snippet.code}`;
  entries.push({
    name,
    value: { importPath, imports: snippet.imports, code },
  });
}

const body = entries
  .map(
    ({ name, value }) =>
      `  ${JSON.stringify(name)}: ${JSON.stringify(value, null, 2).replace(/\n/g, "\n  ")},`,
  )
  .join("\n");

const source = `// Generated by scripts/generate-component-usage.mjs — do not edit by hand.
// Run: node scripts/generate-component-usage.mjs

export interface ComponentUsage {
  importPath: string;
  imports: string[];
  code: string;
}

export const COMPONENT_USAGE: Record<string, ComponentUsage> = {
${body}
};
`;

writeFileSync(outFile, source);
console.log(`component usage: ${entries.length} components -> ${outFile}`);
