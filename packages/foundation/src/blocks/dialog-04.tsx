"use client";

'use client';

import { Button } from "../templates/button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../templates/dialog.js";
import { Input } from "../templates/input.js";
import { Label } from "../templates/label.js";

export default function Dialog03() {
  return (
    <Dialog>
      <div className="flex items-center justify-center py-36">
        <DialogTrigger asChild><Button>Edit Profile</Button></DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="font-medium text-sm" htmlFor="username">
            Username
          </Label>
          <Input
            id="username"
            name="username"
            placeholder="Your username"
            type="text"
          />
        </div>
        <DialogFooter>
          <Button className="w-full" type="submit">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
