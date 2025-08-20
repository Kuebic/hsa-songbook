import { Button, type ButtonProps } from '../ui/Button'

// These are compatibility wrappers for the old FormButton components
// They map to the shadcn Button with appropriate variants

export function SubmitButton(props: ButtonProps) {
  return <Button type="submit" variant="default" {...props} />
}

export function CancelButton(props: ButtonProps) {
  return <Button type="button" variant="secondary" {...props} />
}

export function ResetButton(props: ButtonProps) {
  return <Button type="reset" variant="outline" {...props} />
}

export function DeleteButton(props: ButtonProps) {
  return <Button variant="destructive" {...props} />
}