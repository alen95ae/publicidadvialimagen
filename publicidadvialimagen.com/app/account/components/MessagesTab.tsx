"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Loader2, Calendar, Mail, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useMessages, Message } from "@/hooks/use-messages"
import { useTranslations } from "@/hooks/use-translations"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface MessagesTabProps {
  userId: string
}

export default function MessagesTab({ userId }: MessagesTabProps) {
  const [removing, setRemoving] = useState<string | null>(null)
  const { toast } = useToast()
  const { messages, loading, markAsRead, deleteMessage } = useMessages()
  const { t } = useTranslations()

  const handleMarkAsRead = async (messageId: string) => {
    await markAsRead(messageId)
  }

  const handleDeleteMessage = async (messageId: string) => {
    setRemoving(messageId)
    try {
      await deleteMessage(messageId)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('account.messages.deleteMessage'),
      })
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('account.messages.title')}</CardTitle>
          <CardDescription>{t('account.messages.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const unreadCount = messages.filter(m => !m.leido).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.messages.title')}</CardTitle>
        <CardDescription>
          {t('account.messages.description')} ({messages.length})
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2">
              {unreadCount} {t('account.messages.unread')}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('account.messages.noMessages')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('account.messages.noMessagesDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id} className={`overflow-hidden ${!message.leido ? 'border-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{message.asunto}</h3>
                        {!message.leido && (
                          <Badge variant="default" className="text-xs">{t('account.messages.new')}</Badge>
                        )}
                        {message.respondido && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {t('account.messages.responded')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(message.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMessage(message.id)}
                      disabled={removing === message.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {removing === message.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Mail className="h-4 w-4" />
                    <span>{message.email}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {message.mensaje}
                  </p>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => !message.leido && handleMarkAsRead(message.id)}
                      >
                        {t('account.messages.viewFullMessage')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{message.asunto}</DialogTitle>
                        <DialogDescription>
                          {t('account.messages.receivedOn')} {format(new Date(message.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">{t('account.messages.from')}</h4>
                          <p className="text-sm">{message.email}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">{t('account.messages.message')}</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {message.mensaje}
                          </p>
                        </div>
                        {message.respuesta && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2 text-green-600">{t('account.messages.response')}</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {message.respuesta}
                            </p>
                            {message.fecha_respuesta && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {t('account.messages.respondedOn')} {format(new Date(message.fecha_respuesta), "d 'de' MMMM, yyyy", { locale: es })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

