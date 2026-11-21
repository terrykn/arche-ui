"use client";

"use client"

import { useState } from "react"
import { Button } from "../templates/button.js"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../templates/card.js"
import { Field, FieldError, FieldLabel } from "../templates/field.js"
import { Input } from "../templates/input.js"
import { IconPlaceholder } from "./shared/icon-placeholder.js"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthBlock() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!emailPattern.test(email)) {
      setError("Enter a valid email address")
      return
    }
    setError("")
    setSent(true)
  }

  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-12 text-foreground">
      <Card className="w-full max-w-sm">
        {sent ? (
          <>
            <CardHeader className="items-center text-center">
              <span
                className="mx-auto flex size-11 items-center justify-center rounded-lg border-(length:--border-width) border-border bg-muted/40"
                aria-hidden="true"
              >
                <IconPlaceholder
                  lucide="Send"
                  tabler="IconSend"
                  hugeicons="MailSendIcon"
                  phosphor="PaperPlane"
                  remixicon="RiMailSendLine"
                  className="size-5"
                />
              </span>
              <CardTitle className="mt-4 text-xl font-bold tracking-tight">
                Check your inbox
              </CardTitle>
              <CardDescription className="text-sm">
                If an account exists for{" "}
                <span className="font-medium text-foreground">{email}</span>,
                we&apos;ve sent a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Use a different email
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold tracking-tight">
                Forgot your password?
              </CardTitle>
              <CardDescription className="text-sm">
                Enter your email and we&apos;ll send you a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} noValidate>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    aria-invalid={!!error}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (error) setError("")
                    }}
                  />
                  <FieldError>{error}</FieldError>
                </Field>
                <Button type="submit" className="mt-4 w-full">
                  Send reset link
                </Button>
              </form>
            </CardContent>
          </>
        )}
        <CardFooter className="justify-center">
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground" asChild><a  href="#">
            <IconPlaceholder
              lucide="ArrowLeft"
              tabler="IconArrowLeft"
              hugeicons="ArrowLeftIcon"
              phosphor="ArrowLeft"
              remixicon="RiArrowLeftLine"
              data-icon="inline-start"
              aria-hidden="true"
            />
            Back to sign in
          </a></Button>
        </CardFooter>
      </Card>
    </section>
  )
}
