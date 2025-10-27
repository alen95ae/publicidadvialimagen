"use client"

import { useState } from "react"
import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useTranslations } from "@/hooks/use-translations"

interface ProfileTabProps {
  user: {
    id: string
    email: string
    name?: string
    role?: string
  }
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const { toast } = useToast()
  const { updateProfile } = useAuth()
  const { t } = useTranslations()
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState(user?.name || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await updateProfile({
        name,
      })

      if (error) {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: error.message,
        })
        return
      }

      toast({
        title: t('account.profile.profileUpdated'),
        description: t('account.profile.profileUpdatedDesc'),
      })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.profile.title')}</CardTitle>
        <CardDescription>
          {t('account.profile.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src="" alt={name} />
            <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Button variant="outline" size="sm" disabled>
              <Upload className="mr-2 h-4 w-4" />
              {t('account.profile.uploadPhoto')}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {t('account.profile.uploadPhotoComingSoon')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('account.profile.fullName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('account.profile.fullNamePlaceholder')}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('account.profile.email')}</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {t('account.profile.emailCannotChange')}
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('account.profile.saveChanges')}
            </Button>
          </div>
        </form>

      </CardContent>
    </Card>
  )
}

