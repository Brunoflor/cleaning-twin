import { signOut } from '@/lib/actions'
import { buttonClass } from '@/components/ui'

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className={buttonClass('ghost')}>
        Esci
      </button>
    </form>
  )
}
