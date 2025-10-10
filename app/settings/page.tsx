"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Github, Key, Palette, Zap } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your funnel builder preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* GitHub Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Github className="mr-2 h-5 w-5" />
              GitHub Integration
            </CardTitle>
            <CardDescription>
              Configure GitHub for automated deployments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-token">
                <Key className="mr-2 inline h-4 w-4" />
                GitHub Personal Access Token
              </Label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                Required for GitHub Pages deployment. Scope: repo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github-username">GitHub Username</Label>
              <Input
                id="github-username"
                placeholder="mrmoe28"
                defaultValue="mrmoe28"
              />
            </div>

            <Button>Update GitHub Settings</Button>
          </CardContent>
        </Card>

        {/* Default Funnel Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="mr-2 h-5 w-5" />
              Default Funnel Settings
            </CardTitle>
            <CardDescription>
              Set default values for new funnel pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-primary">Default Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="default-primary"
                    type="color"
                    defaultValue="#a855f7"
                    className="h-10 w-20"
                  />
                  <Input
                    type="text"
                    defaultValue="#a855f7"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-bg">Default Background</Label>
                <div className="flex gap-2">
                  <Input
                    id="default-bg"
                    type="color"
                    defaultValue="#0b1220"
                    className="h-10 w-20"
                  />
                  <Input type="text" defaultValue="#0b1220" className="flex-1" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-tagline">Default Tagline</Label>
              <Input
                id="default-tagline"
                placeholder="The fastest way to get things done"
              />
            </div>

            <Button>Save Defaults</Button>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Advanced configuration options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-deploy to GitHub Pages</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically deploy after generation
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Add analytics tracking to generated pages
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Screenshot Quality</Label>
                <p className="text-sm text-muted-foreground">
                  Higher quality = larger file sizes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions - proceed with caution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-3">
              <div>
                <p className="font-medium">Delete all generated funnels</p>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all your funnel pages
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete All
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-3">
              <div>
                <p className="font-medium">Reset to defaults</p>
                <p className="text-sm text-muted-foreground">
                  Reset all settings to factory defaults
                </p>
              </div>
              <Button variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
