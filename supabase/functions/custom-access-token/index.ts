// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Type definition for the auth hook payload
interface AuthHookPayload {
  user_id: string;
  claims: Record<string, any>;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

console.info('Custom access token hook started');

Deno.serve(async (req: Request) => {
  try {
    // Parse the incoming request
    const payload: AuthHookPayload = await req.json()
    const { user_id, claims } = payload
    
    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Get user's role from database
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle() // Use maybeSingle instead of single to avoid error when no row found
    
    // Default to 'user' role if no role found or on error
    const userRole = roleData?.role || 'user'
    
    // Add custom claims to the JWT
    const customClaims = {
      ...claims,
      user_role: userRole,
      can_moderate: userRole === 'admin' || userRole === 'moderator',
      can_admin: userRole === 'admin'
    }
    
    // Return the modified claims
    // IMPORTANT: The response must include the claims in the format expected by Supabase
    return new Response(
      JSON.stringify({ claims: customClaims }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in custom access token hook:', error)
    
    // On any error, return the original claims to avoid blocking authentication
    // This ensures users can still log in even if role assignment fails
    try {
      const { claims } = await req.json()
      return new Response(
        JSON.stringify({ claims }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Connection': 'keep-alive'
          },
          status: 200 
        }
      )
    } catch (fallbackError) {
      // If we can't even parse the request, return a minimal valid response
      return new Response(
        JSON.stringify({ claims: {} }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Connection': 'keep-alive'
          },
          status: 200 
        }
      )
    }
  }
})