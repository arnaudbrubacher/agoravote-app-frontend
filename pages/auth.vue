<template>
  <div class="auth-container max-w-md mx-auto mt-10 p-6 border border-gray-300 rounded-lg bg-white">
    <div class="tabs">
      <button :class="{'active': isLogin}" @click="isLogin = true" class="tab">Login</button>
      <button :class="{'active': !isLogin}" @click="isLogin = false" class="tab">Signup</button>
    </div>
    <div v-if="isLogin">
      <h2 class="text-2xl font-bold mb-6">Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="login-email" class="block text-sm font-medium text-gray-700">Email:</label>
          <input type="email" id="login-email" v-model="loginEmail" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div class="mb-4">
          <label for="login-password" class="block text-sm font-medium text-gray-700">Password:</label>
          <input type="password" id="login-password" v-model="loginPassword" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <button type="submit" class="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Login</button>
      </form>
    </div>
    <div v-else>
      <h2 class="text-2xl font-bold mb-6">Signup</h2>
      <form @submit.prevent="handleSignup">
        <div class="mb-4">
          <label for="signup-name" class="block text-sm font-medium text-gray-700">Name:</label>
          <input type="text" id="signup-name" v-model="signupName" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div class="mb-4">
          <label for="signup-email" class="block text-sm font-medium text-gray-700">Email:</label>
          <input type="email" id="signup-email" v-model="signupEmail" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div class="mb-4">
          <label for="signup-password" class="block text-sm font-medium text-gray-700">Password:</label>
          <input type="password" id="signup-password" v-model="signupPassword" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <button type="submit" class="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Signup</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isLogin: true,
      loginEmail: '',
      loginPassword: '',
      signupName: '',
      signupEmail: '',
      signupPassword: ''
    };
  },
  methods: {
    handleLogin() {
      // Add logic for login
      alert(`Login Email: ${this.loginEmail}, Login Password: ${this.loginPassword}`);
    },
    handleSignup() {
      // Add logic for signup
      alert(`Signup Name: ${this.signupName}, Signup Email: ${this.signupEmail}, Signup Password: ${this.signupPassword}`);
    }
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.tabs {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  cursor: pointer;
  border: none;
  background: none;
  font-size: 16px;
}

.tab.active {
  font-weight: bold;
  border-bottom: 2px solid #42b983;
}
</style>