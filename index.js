import axios from 'axios'
import fs from 'fs'
import FormData from "form-data"

import * as Classes from './Classes/index.js'
import * as Utils from './utils.js'

export var ClientAuth;

export class Client {
	constructor({_data, userid, token}) {
		this._data = _data;
		this._auth = `${userid};${token}`;
		this._bot = null;

		ClientAuth = this._auth;
		formatBot(this)
	}

	async post(text, groupid, images = []) {
		if(!text || text.length == 0) return 'Text is needed.';
		
		return new Promise(async (res, rej) => {
			let formData = new FormData()
			formData.append('data', JSON.stringify({ text }))
			for(let i=0;i<images.length;i++) {
				formData.append(`image${i}`, fs.createReadStream(images[i]))
			}

			axios.post(`https://photop.exotek.co/posts/new${groupid?`?group=${groupid}`:''}`, formData, {
				headers: {
					auth: ClientAuth
				}
			}).then(response => {
				res(response.data)
			}).catch(response => {
				res(response.response.data)
			})
		})
	}

	async onPost(callback, dataObj) {
		//
	}
	async onInvite(callback, dataObj) {
		//
	}

	async createGroup(dataObj) {
		//
	}
	
	async getPosts(dataObj) {
		let data = { ...dataObj }
		let url = 'posts';
		if(data.postid) {
			url += `?postid=${data.postid}`;
		} else if(data.userid) {
			url += `?userid=${data.userid}`;
		}
		
		if(data.groupid) {
			url += `?groupid=${data.groupid}`;
		}
		if(data.before) {
			url += `?before=${data.before}`;
		}
		if(data.after) {
			url += `?after=${data.after}`;
		}
		
		return new Promise(async (res) => {
			let [code, response] = await Utils.request('GET', url)

			if(code == 200) {
				let formattedPosts = JSON.parse(response).posts.map(async (postData) => {
					return await new Classes.Post({ data: postData })
				})
				
				res(formattedPosts)
			} else {
				res(response)
			}
		})
	}
	async getChats(dataObj) {
		let data = { ...dataObj }
		let url = 'chats';
		if(data.chatid) {
			url += `?chatid=${data.chatid}`;
		} else if(data.userid) {
			url += `?userid=${data.userid}`;
		} else if(data.postid) {
			url += `?postid=${data.postid}`;
		}

		if(data.groupid) {
			url += `?groupid=${data.groupid}`;
		}
		if(data.before) {
			url += `?before=${data.before}`;
		}
		if(data.after) {
			url += `?after=${data.after}`;
		}

		return new Promise(async (res) => {
			let [code, response] = await Utils.request('GET', url)

			if(code == 200) {
				let formattedChats = JSON.parse(response).chats.map(async (chatData) => {
					return await new Classes.Chat({ data: chatData })
				})

				res(formattedChats)
			} else {
				res(response)
			}
		})
	}
	async getUsers(dataObj) {
		let data = { ...dataObj }
		let url = 'user';
		if(data.userid) {
			url += `?id=${data.userid}`;
		} else if(data.name) {
			url += `?name=${data.name}`;
		} else if(data.term) {
			url = `user/search?term=${data.term}`;
		}
		
		return new Promise(async (res) => {
			let [code, response] = await Utils.request('GET', url)

			if(code == 200) {
				let users = JSON.parse(response);
				if(url.startsWith('user/search')) {
					users = users.map(user => user._id)
				}
				
				let formattedUsers = users.map(async (userData) => {
					if(url.startsWith('user/search')) {
						return await new Classes.User({ id: userData })
					} else {
						return await new Classes.User({ data: userData })
					}
				})

				res(formattedUsers)
			} else {
				res(response)
			}
		})
	}
	async getGroups(dataObj) {
		let data = { ...dataObj }
		let url = 'groups';

		if(data.groupid) {
			url += `?groupid=${data.groupid}`;
		}

		if(data.before) {
			url += `?before=${data.before}`;
		}
		if(data.after) {
			url += `?after=${data.after}`;
		}

		return new Promise(async (res) => {
			let [code, response] = await Utils.request('GET', url)

			if(code == 200) {
				let groups = JSON.parse(response).groups;

				let formattedGroups = groups.map(async (groupData) => {
					return await new Classes.Group({ data: groupData })
				})

				res(formattedGroups)
			} else {
				res(response)
			}
		})
	}

	async getBlocked() {
		if(!this._bot) return 'Bot is not logged in.';

		return this._bot.user.BlockedUsers.map(async (user) => {
			let formattedUser = await new Classes.User({ id: user })

			return formattedUser
		})
	}
	async getInvites() {
		//
	}

	async joinGroup(dataObj) {
		let data = { ...dataObj }
		let url = 'groups/join';

		if(data.groupid) {
			url += `?groupid=${data.groupid}`;
		} else if(data.code) {
			url += `?code=${data.code}`;
		}

		return new Promise(async (res) => {
			let [_, response] = await Utils.request('PUT', url)

			res(response)
		})
	}
	async leaveGroup(groupid) {
		let url = `groups/leave?groupid=${groupid}`;

		return new Promise(async (res) => {
			let [_, response] = await Utils.request('DELETE', url)

			res(response)
		})
	}

	async deletePost(id) {
		let [_, response] = await Utils.request('DELETE', `posts?postid=${id}`)

		return response;
	}
	async deleteChat(id) {
		let [_, response] = await Utils.request('DELETE', `chats?chatid=${id}`)

		return response;
	}

	async updateBio(newBio) {
		return new Promise(async (res) => {
			let [_, response] = await Utils.request('POST', 'me/settings', {
				update: 'description',
				value: newBio
			})

			res(response)
		})
	}
	async updateName(newName) {
		return new Promise(async (res) => {
			let [_, response] = await Utils.request('POST', 'me/settings', {
				update: 'username',
				value: newName
			})

			res(response)
		})
	}
	async updateVisibility(newVisibility) {
		return new Promise(async (res) => {
			let [_, response] = await Utils.request('POST', 'me/settings', {
				update: 'visibility',
				value: newVisibility
			})

			res(response)
		})
	}
	async updatePicture(newPicture) {
		let form = new FormData()
		form.append('image', fs.createReadStream(newPicture))
		
		return new Promise(async (res) => {
			let data = await fetch(serverURL + 'me/new/picture', {
				method: 'POST',
				body: form,
				headers: {
					"auth": ClientAuth
				}
			})

			res(await data.text())
		})
	}
	async updateBanner(newBanner) {
		let form = new FormData()
		form.append('image', fs.createReadStream(newBanner))

		return new Promise(async (res) => {
			let data = await fetch(serverURL + 'me/new/banner', {
				method: 'POST',
				body: form,
				headers: {
					"auth": ClientAuth
				}
			})

			res(await data.text())
		})
	}

	async unban(userid) {
		let [_, response] = await Utils.request('PATCH', `mod/unban?userid=${userid}`)

		return response;
	}
}

export default Client;

async function formatBot(client) {
	let [code, response] = await Utils.request('me', 'GET', undefined, ClientAuth)

	if(code == 200) {
		client._bot = JSON.parse(response)
	} else {
		console.error('Error while fetching bot data')
	}
}