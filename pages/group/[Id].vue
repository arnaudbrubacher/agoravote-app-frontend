<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Button variant="ghost" @click="goToDashboard" class="p-2 border">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          <span class="ml-2">Back</span>
        </Button>
        <div>
          <h1 class="text-3xl font-bold">{{ group.name }}</h1>
          <div class="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
            <span>ID: {{ group.id }}</span>
            <div class="flex items-center">
              <Icon name="heroicons:users" class="h-4 w-4 mr-1" />
              <span>{{ group.members.length }} members</span>
            </div>
          </div>
        </div>
      </div>
      <Button variant="outline" @click="goToSettings">Settings</Button>
    </div>

    <Tabs defaultValue="votes" class="w-full">
      <TabsList class="flex justify-between">
        <div class="flex space-x-1">
          <TabsTrigger value="votes" class="border-2 border-transparent data-[state=inactive]:border-white/20 data-[state=inactive]:text-white/70 data-[state=active]:text-white">
            Votes
          </TabsTrigger>
          <TabsTrigger value="posts" class="border-2 border-transparent data-[state=inactive]:border-white/20 data-[state=inactive]:text-white/70 data-[state=active]:text-white">
            Posts
          </TabsTrigger>
          <TabsTrigger value="members" class="border-2 border-transparent data-[state=inactive]:border-white/20 data-[state=inactive]:text-white/70 data-[state=active]:text-white">
            Members
          </TabsTrigger>
        </div>
      </TabsList>

      <TabsContent value="votes">
        <Card>
          <CardContent>
            <div v-if="group.votes.length" class="space-y-4">
              <div v-for="vote in group.votes" :key="vote.id" class="p-4 border rounded-lg">
                <h3 class="text-lg font-medium">{{ vote.title }}</h3>
                <p class="text-sm text-muted-foreground">{{ vote.description }}</p>
              </div>
            </div>
            <div v-else class="text-center py-8 text-muted-foreground">
              No votes yet
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="posts">
        <Card>
          <CardContent>
            <div v-if="group.posts.length" class="space-y-4">
              <div v-for="post in group.posts" :key="post.id" class="p-4 border rounded-lg">
                <h3 class="text-lg font-medium">{{ post.title }}</h3>
                <p class="text-sm text-muted-foreground">{{ post.content }}</p>
              </div>
            </div>
            <div v-else class="text-center py-8 text-muted-foreground">
              No posts yet
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="members">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
            </div>
            <div class="flex items-center space-x-2">
              <Button v-if="isEditingMembers" variant="outline" @click="addMember">
                <Icon name="heroicons:plus" class="h-4 w-4 mr-2" />
                Add Member
              </Button>
              <Button @click="editMembers">
                {{ isEditingMembers ? 'Done' : 'Edit List' }}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="group && group.members && group.members.length" class="space-y-4">
              <div
                v-for="member in group.members"
                :key="member.id"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex items-center space-x-2">
                  <div class="w-10 h-10 rounded-full" :style="{ backgroundColor: member.picture }"></div>
                  <span class="font-medium">{{ member.name }}</span>
                  <span class="text-sm text-muted-foreground">{{ member.role }}</span>
                </div>
                <div v-if="!isEditingMembers">
                  <Button variant="ghost" size="sm" class="border" @click="viewMember(member)">
                    View
                  </Button>
                </div>
                <div v-else>
                  <Button variant="destructive" size="sm" class="border" @click="removeMember(member)">
                    Remove
                  </Button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-muted-foreground">
              No members yet
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/Icon.vue';
import { groups } from '@/data/groups.js';

const route = useRoute();
const groupId = route.params.id;

const isEditingMembers = ref(false);
const group = computed(() => groups.find(g => g.id === parseInt(groupId)));

const editMembers = () => {
  isEditingMembers.value = !isEditingMembers.value;
};

const addMember = () => {
  // Logic to add a new member
};

const viewMember = (member) => {
  // Logic to view member details
};

const removeMember = (member) => {
  if (group.value && group.value.members) {
    group.value.members = group.value.members.filter(m => m.id !== member.id);
  }
};
</script>