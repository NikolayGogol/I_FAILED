<route lang="json">
{
"meta": {
"layout": "AuthMinLayout"
}
}
</route>
<script setup>
  import { useRouter } from 'vue-router'

  const key = sessionStorage.getItem('congrats')
  const router = useRouter()
  if (key) {
    setTimeout(() => {
      sessionStorage.removeItem('congrats')
      router.push('/login')
    }, 4000)
  } else {
    router.push('/login')
  }
</script>

<template>
  <div class="d-flex align-center justify-center h-100 flex-column">
    <img alt="" src="../assets/auth/Group12.svg">
    <p class="font-weight-semibold mt-5 text-h4 text-center">Congrats! Your account <br> is created</p>
  </div>
</template>

<style lang="scss">
#app {
  height: 100vh;
}
</style>
