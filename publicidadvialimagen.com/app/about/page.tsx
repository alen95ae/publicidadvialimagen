"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, Award, Users, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/use-translations"

export default function AboutPage() {
  const { t } = useTranslations()
  
  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('about.page.breadcrumb')}</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            {t('nav.home')}
          </Link>
          <span className="mx-2">/</span>
          <span>{t('about.page.breadcrumb')}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden order-1 md:order-1">
          <Image
            src="/publicidad_vial_imagen.png"
            alt="Equipo de Publicidad Vial Imagen"
            fill
            className="object-contain rounded-lg"
          />
        </div>
        <div className="order-2 md:order-2">
          <h2 className="text-3xl font-bold mb-4">{t('about.page.ourStory')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('about.page.ourStoryDesc1')}
          </p>
          <p className="text-muted-foreground mb-4">
            {t('about.page.ourStoryDesc2')}
          </p>
          <p className="text-muted-foreground">
            {t('about.page.ourStoryDesc3')}
          </p>
        </div>
      </div>

      {/* Second Hero Section */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <div className="order-2 md:order-1">
          <h2 className="text-3xl font-bold mb-4">{t('about.page.ourCompany')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('about.page.ourCompanyDesc1')}
          </p>
          <p className="text-muted-foreground mb-4">
            {t('about.page.ourCompanyDesc2')}
          </p>
          <p className="text-muted-foreground mb-4">
            {t('about.page.ourCompanyDesc3')}
          </p>
          <p className="text-muted-foreground">
            {t('about.page.ourCompanyDesc4')}
          </p>
        </div>
        <div className="flex justify-center order-1 md:order-2">
          <div className="relative">
            <Image
              src="/martin_sillerico.png"
              alt="Martín Sillerico Ariñez"
              width={300}
              height={400}
              className="rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-[#be0811]/80 text-white p-3 rounded-lg">
              <p className="italic text-sm">Martín Sillerico Ariñez</p>
              <p className="font-bold text-sm">{t('about.page.generalManager')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">{t('about.page.ourValues')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('about.page.ourValuesDesc')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('about.page.commitment')}</h3>
            <p className="text-muted-foreground">
              {t('about.page.commitmentDesc')}
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('about.page.qualityGuaranteed')}</h3>
            <p className="text-muted-foreground">
              {t('about.page.qualityDesc')}
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('about.page.customerFocus')}</h3>
            <p className="text-muted-foreground">
              {t('about.page.customerDesc')}
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('about.page.reliability')}</h3>
            <p className="text-muted-foreground">
              {t('about.page.reliabilityDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">{t('about.page.ourTeam')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('about.page.ourTeamDesc')}
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative w-full max-w-4xl h-[400px] md:h-[500px] rounded-lg overflow-hidden">
            <Image
              src="/equipo_imagen.png"
              alt={t('about.page.ourTeam')}
              fill
              className="object-contain rounded-lg"
            />
          </div>
        </div>
        <div className="mt-8 text-center max-w-3xl mx-auto">
          <p className="text-muted-foreground">
            {t('about.page.ourTeamText')}
          </p>
        </div>
      </div>

    </div>
  )
}
