import React, { useState } from 'react'
import { supabase } from '../supabase_client'
import { createOrganization } from '../services/organization_service'

export default function OnboardingScreen({ session, onComplete }) {
  const [companyName, setCompanyName] = useState('')
  const [agreedToTos, setAgreedToTos] = useState(false)
  const [showTosModal, setShowTosModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!companyName.trim() || !agreedToTos) return
    setLoading(true)

    try {
      // 1. Create Organization with Terms of Service timestamp
      const org = await createOrganization(companyName, session.user.id, new Date().toISOString())

      // 2. Upsert Profile
      const { data: newProfile, error: profileErr } = await supabase.from('profiles').upsert({
        id: session.user.id,
        email: session.user.email,
        organization_id: org.id,
        is_global_staff: true,
        signup_code: session.user.user_metadata?.signup_code
      }).select().single()

      if (profileErr) throw profileErr

      // 3. Burn the signup key
      const usedCode = session.user.user_metadata?.signup_code
      if (usedCode) {
        await supabase.from('onboarding_keys').update({
          is_redeemed: true,
          redeemed_at: new Date().toISOString(),
          redeemed_by: session.user.id
        }).ilike('key_code', usedCode).eq('is_redeemed', false)
      }

      onComplete(newProfile, org)
    } catch (err) {
      console.error('Onboarding failed:', err)
      alert('Failed to setup your account: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
      <div style={{ background: 'var(--bg-card)', padding: 40, borderRadius: 12, border: '1px solid var(--border)', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8, fontSize: 24, fontWeight: 900 }}>Welcome to Submittal Tracker</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Let\'s get your workspace set up.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: 8, display: 'block' }}>Organization Name</label>
            <input 
              type="text" 
              className="form-input card" 
              placeholder="e.g., Pacific Electrical Contractors" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
              autoFocus
              style={{ width: '100%', padding: 12 }}
            />
          </div>

          <div style={{ textAlign: 'left', background: 'var(--bg-elevated)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={agreedToTos}
                onChange={(e) => setAgreedToTos(e.target.checked)}
                disabled={loading}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
              <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>
                I agree to the <span style={{ color: 'var(--accent)', textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); setShowTosModal(true); }}>Terms of Service</span>. I understand this software is provided as-is, and Submittal Tracker is not liable for construction delays, material costs, or missed deadlines.
              </div>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !companyName.trim() || !agreedToTos} style={{ width: '100%', padding: 14, justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Setting up...' : 'Create Workspace'}
          </button>
        </form>
      </div>

      {showTosModal && (
        <div className="modal-backdrop animate-in" style={{ zIndex: 1100, padding: 24 }}>
          <div className="modal" style={{ maxWidth: 600, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 24, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900 }}>Terms of Service</h2>
              <button className="btn-icon" onClick={() => setShowTosModal(false)}>✕</button>
            </div>
            <div style={{ padding: 24, overflowY: 'auto', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <h3 style={{ color: 'var(--text)', marginBottom: 8, fontSize: 14, fontWeight: 700 }}>1. Limitation of Liability</h3>
              <p style={{ marginBottom: 16 }}>
                IN NO EVENT SHALL THE CREATORS OF SUBMITTAL TRACKER BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION, CONSTRUCTION DELAYS, OR MATERIAL COSTS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
              </p>
              
              <h3 style={{ color: 'var(--text)', marginBottom: 8, fontSize: 14, fontWeight: 700 }}>2. As-Is Provision</h3>
              <p style={{ marginBottom: 16 }}>
                This software is provided "as is" and any express or implied warranties, including, but not limited to, the implied warranties of merchantability and fitness for a particular purpose are disclaimed. The user assumes all responsibility for the accuracy of dates, documents, and submittal statuses entered into the system.
              </p>
            </div>
            <div style={{ padding: 24, borderTop: '1px solid var(--border)', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => { setAgreedToTos(true); setShowTosModal(false); }}>I Understand and Agree</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
