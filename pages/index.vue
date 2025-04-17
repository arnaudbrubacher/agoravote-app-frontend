<template>
  <div>
    <!-- Header -->
    <header class="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-16 items-center px-4">
        <h1 class="text-xl font-bold text-primary">Agora Vote</h1>
        <nav class="ml-auto">
          <ul class="flex items-center gap-6">
            <li><a href="#" @click.prevent="scrollToHowItWorks" class="text-foreground hover:text-primary transition-colors">How It Works</a></li>
            <li><a href="#" @click.prevent="scrollToSecurity" class="text-foreground hover:text-primary transition-colors">Security</a></li>
            <li><a href="#" @click.prevent="scrollToContact" class="text-foreground hover:text-primary transition-colors">Contact</a></li>
            <li><Button @click="openApp" variant="default">Open App</Button></li>
          </ul>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="py-20 md:py-28">
      <div class="container px-4 md:px-6">
        <div class="grid gap-6 items-center">
          <div class="space-y-4 max-w-3xl mx-auto text-center">
            <h1 class="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Agora Vote
              <div class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2">Online Voting Platform</div>
            </h1>
            <p class="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
              <strong>Trade Unions · Boards of Directors · Cooperatives · Associations · Municipalities</strong>
            </p>
            <div class="flex flex-col gap-2 min-[400px]:flex-row justify-center mt-6">
              <Button @click="openApp" size="lg" class="font-medium bg-black text-white hover:bg-gray-800">Open App</Button>
              <Button @click="scrollToContact" variant="outline" size="lg" class="font-medium">Contact</Button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 bg-muted/50">
      <div class="container px-4 md:px-6">
        <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
          <div class="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div class="rounded-full bg-primary/10 p-4">
              <CheckCircleIcon class="h-6 w-6 text-primary" />
            </div>
            <h3 class="text-xl font-bold">Simple</h3>
            <p class="text-center text-muted-foreground">
              Agora Vote lets you create a ballot by yourself, instantly, without having to contact our team.
            </p>
          </div>
          <div class="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div class="rounded-full bg-primary/10 p-4">
              <LockIcon class="h-6 w-6 text-primary" />
            </div>
            <h3 class="text-xl font-bold">Secure</h3>
            <p class="text-center text-muted-foreground">
              Agora Vote uses the latest improvements in cryptography to insure a secret and verifiable ballot.
            </p>
          </div>
          <div class="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
            <div class="rounded-full bg-primary/10 p-4">
              <GlobeIcon class="h-6 w-6 text-primary" />
            </div>
            <h3 class="text-xl font-bold">Online</h3>
            <p class="text-center text-muted-foreground">
              Agora Vote allows participants to vote from anywhere and from any device.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonial -->
    <section class="py-16">
      <div class="container px-4 md:px-6">
        <div class="mx-auto max-w-3xl text-center">
          <blockquote class="text-xl md:text-2xl italic text-foreground">
            "The vote went very well and we really appreciated the support before, during and after the vote."
          </blockquote>
          <div class="mt-4">
            <p class="font-medium">Guillaume Racine, President</p>
            <p class="text-muted-foreground">CSN-FSSS, SPBTPA (category 3)</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works-section" class="py-16 bg-muted/50">
      <div class="container px-4 md:px-6">
        <div class="flex flex-col items-center justify-center space-y-4 text-center">
          <div class="space-y-2">
            <h2 class="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
          </div>
        </div>
        <div class="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
          <div class="flex flex-col items-center space-y-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">1</div>
            <h3 class="text-xl font-bold">Create a vote</h3>
            <p class="text-center text-muted-foreground">
              Organizers setup the ballot, upload the list of members and start the vote.
            </p>
          </div>
          <div class="flex flex-col items-center space-y-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">2</div>
            <h3 class="text-xl font-bold">Vote</h3>
            <p class="text-center text-muted-foreground">
              Members receive an email including a hyperlink to the voting page.
            </p>
          </div>
          <div class="flex flex-col items-center space-y-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">3</div>
            <h3 class="text-xl font-bold">View results</h3>
            <p class="text-center text-muted-foreground">
              At the chosen time, results are published to members or organizers.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Security Section -->
    <section id="security-section" class="py-16">
      <div class="container px-4 md:px-6">
        <div class="flex flex-col items-center justify-center space-y-4 text-center">
          <div class="space-y-2">
            <h2 class="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Security</h2>
          </div>
        </div>
        <div class="mx-auto max-w-4xl py-8">
          <p class="text-center text-lg font-medium mb-6">
            <strong>Our priority is to ensure the secrecy and integrity of the vote.</strong>
          </p>
          <p class="text-muted-foreground mb-4">
            Guided by the principles of the Presumed Security paradigm, our voting system is build upon certified open-source voting codes. Our approach embraces robust privacy-preserving techniques, including Non-interactive Zero-Knowledge Proofs (NIZK), threshold key generation ceremonies, and asymmetric encryption, all of which combine to ensure the utmost security and anonymity for the votes.
          </p>
          <p class="text-muted-foreground mb-4">
            To ensure the transparency and verifiability of each ballot, we record essential voting data in compliance with the "NIST Special Publication 1500-100 revision 2.0" format. This allows third parties to conduct audits on the voting process without compromising the privacy of voters.
          </p>
          <p class="text-muted-foreground">
            Continuously committed to the advancement of online voting, we maintain an ongoing pursuit of academic research, testing, and enhancement of our voting system design.
          </p>
        </div>
      </div>
    </section>

    <!-- Mission & Vision -->
    <section class="py-16 bg-muted/50">
      <div class="container px-4 md:px-6">
        <div class="mx-auto max-w-5xl">
          <div class="grid gap-8 md:grid-cols-2">
            <div class="rounded-xl border bg-card p-6 shadow-sm">
              <h3 class="text-xl font-bold mb-4">Mission</h3>
              <p class="text-muted-foreground">
                Civic technologies capitalize on the promise that information technologies hold democratic potential. Through information technologies, more participatory modes of governance are possible.
              </p>
            </div>
            <div class="rounded-xl border bg-card p-6 shadow-sm">
              <h3 class="text-xl font-bold mb-4">Vision</h3>
              <p class="text-muted-foreground">
                At launch, Agora Vote is a voting application. Voting, however, is only one element of democratic governance. Over time, Agora Vote will become a governance application. Soon, members will be able to share information, debate, co-create proposals, delegate powers and vote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact-section" class="py-16">
      <div class="container px-4 md:px-6">
        <div class="flex flex-col items-center justify-center space-y-4 text-center">
          <div class="space-y-2">
            <h2 class="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Contact</h2>
          </div>
        </div>
        <div class="mx-auto max-w-3xl py-8">
          <div class="grid gap-8 md:grid-cols-2">
            <div class="space-y-4">
              <div class="flex justify-center mb-6">
                <img src="/images/profile.jpg" alt="Contact Person" class="rounded-full w-32 h-32 object-cover shadow-md" />
              </div>
              <div class="flex items-center space-x-3">
                <div class="rounded-full bg-primary/10 p-2">
                  <MailIcon class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold">Email</h3>
                  <p class="text-muted-foreground">arnaud_brubacher@hotmail.com</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <div class="rounded-full bg-primary/10 p-2">
                  <PhoneIcon class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold">Phone</h3>
                  <p class="text-muted-foreground">1 (450) 405-3415</p>
                </div>
              </div>
            </div>
            <div class="rounded-lg border p-6">
              <form class="space-y-4" @submit.prevent="submitContactForm">
                <div class="space-y-2">
                  <label for="name" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                  <input 
                    id="name" 
                    v-model="contactForm.name"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="Your name" 
                    required
                  />
                </div>
                <div class="space-y-2">
                  <label for="email" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                  <input 
                    id="email" 
                    type="email" 
                    v-model="contactForm.email"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="Your email" 
                    required
                  />
                </div>
                <div class="space-y-2">
                  <label for="message" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Message</label>
                  <textarea 
                    id="message" 
                    v-model="contactForm.message"
                    class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="Your message"
                    required
                  ></textarea>
                </div>
                <Button 
                  type="submit" 
                  class="w-full"
                  :disabled="isSubmitting"
                >
                  {{ isSubmitting ? 'Sending...' : 'Send Message' }}
                </Button>
                <div v-if="formStatus.message" :class="['text-center text-sm mt-2', formStatus.success ? 'text-green-600' : 'text-red-600']">
                  {{ formStatus.message }}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { 
  LockIcon, 
  CheckCircleIcon, 
  UsersIcon, 
  UserIcon, 
  ShieldIcon, 
  EyeOffIcon, 
  CodeIcon,
  CheckIcon,
  ServerIcon,
  LayoutIcon,
  GlobeIcon,
  MailIcon,
  PhoneIcon
} from 'lucide-vue-next'

definePageMeta({
  layout: 'landingpage'
})

const router = useRouter()

// Contact form data
const contactForm = ref({
  name: '',
  email: '',
  message: ''
})

const isSubmitting = ref(false)
const formStatus = ref({
  success: false,
  message: ''
})

const openApp = () => {
  window.location.href = '/auth'
}

const scrollToHowItWorks = () => {
  const section = document.getElementById('how-it-works-section')
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' })
  }
}

const scrollToSecurity = () => {
  const section = document.getElementById('security-section')
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' })
  }
}

const scrollToContact = () => {
  // Scroll to the contact section
  const contactSection = document.getElementById('contact-section')
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth' })
  }
}

const submitContactForm = async () => {
  try {
    isSubmitting.value = true
    formStatus.value = { success: false, message: '' }
    
    // Send the form data to our API endpoint
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contactForm.value.name,
        email: contactForm.value.email,
        message: contactForm.value.message
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      // Success message
      formStatus.value = {
        success: true,
        message: 'Thank you! Your message has been sent to arnaud_brubacher@hotmail.com'
      }
      
      // Reset form
      contactForm.value = {
        name: '',
        email: '',
        message: ''
      }
    } else {
      throw new Error(result.message || 'Failed to send message')
    }
  } catch (error) {
    console.error('Error sending message:', error)
    formStatus.value = {
      success: false,
      message: error.message || 'There was an error sending your message. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const scheduleDemo = () => {
  router.push('/contact?demo=true')
}
</script>

<style scoped>
.home-container {
  text-align: center;
  margin-top: 50px;
}
</style>