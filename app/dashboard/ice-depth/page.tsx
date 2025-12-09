import { getSession } from '@/lib/auth'
import { getUserPermissions, canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import IceDepthDashboard from './IceDepthDashboard'

interface Submission {
  id: string
  submittedAt: string
  data: any
  rink: { id: string; name: string }
  submittedBy: { id: string; firstName: string; lastName: string }
}

interface Rink {
  id: string
  name: string
}

const PAGE_SIZE = 20

export default function IceDepthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [total, setTotal] = useState(0)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset > 0) setLoadingMore(true)

      const [meRes, rinksRes, submissionsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/rinks'),
        fetch(`/api/submissions?moduleType=ICE_DEPTH&limit=${PAGE_SIZE}&page=${Math.floor(offset / PAGE_SIZE) + 1}`),
      ])

      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const meData = await meRes.json()

      // Check permissions
      const permissions = meData.user?.role?.permissions
      if (!permissions?.iceDepth?.access) {
        router.push('/dashboard')
        return
      }

      setCanSubmit(permissions?.iceDepth?.submit || false)

      if (rinksRes.ok) {
        const rinksData = await rinksRes.json()
        setRinks(rinksData.rinks || [])
      }

      if (submissionsRes.ok) {
        const data = await submissionsRes.json()
        if (append) {
          setSubmissions(prev => [...prev, ...(data.submissions || [])])
        } else {
          setSubmissions(data.submissions || [])
        }
        setTotal(data.total || 0)
      }
    } catch (err) {
      setError('Failed to load data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const loadMore = () => {
    fetchData(submissions.length, true)
  }

  const permissions = getUserPermissions(user)

  // Check if user has access to ice depth module
  if (!canUserAccess(user, 'iceDepth', 'access')) {
    redirect('/dashboard')
  }

  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    facilityId: user.facilityId,
    permissions,
  }

  return <IceDepthDashboard user={userData} />
}
