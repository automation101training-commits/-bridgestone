<template>
  <div class="space-y-6">
    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            Admin Only
          </div>
          <h1 class="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">จัดการคอร์ส ลูกค้า และสิทธิ์เข้าดู</h1>
          <p class="mt-2 max-w-3xl text-sm text-slate-500">
            หน้านี้ใช้สำหรับเพิ่มคอร์ส เพิ่มบทเรียน และกำหนดว่าลูกค้าคนไหนเข้าดูคอร์สไหนได้บ้าง
            ลูกค้าทั่วไปจะไม่เห็นหน้านี้และเปิดเข้า route นี้ไม่ได้
          </p>
        </div>

        <button
          type="button"
          class="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="loadDashboard"
        >
          รีเฟรชข้อมูล
        </button>
      </div>
    </section>

    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
      กำลังโหลดข้อมูลหลังบ้าน...
    </div>

    <div v-else-if="pageErrorMsg" class="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
      {{ pageErrorMsg }}
    </div>

    <template v-else>
      <div v-if="flashMsg" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
        {{ flashMsg }}
      </div>

      <div class="space-y-6">
        <section id="customers" class="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-slate-900">สิทธิ์เข้าดูของลูกค้า</h2>
              <p class="mt-1 text-sm text-slate-500">
                ลูกค้าต้องสมัครสมาชิกก่อน แล้วค่อยให้สิทธิ์เข้าดูคอร์สจากหน้านี้
              </p>
            </div>
          </div>

          <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="text-base font-bold text-slate-900">บัญชีลูกค้าที่ลงทะเบียน</h3>
                <p class="mt-1 text-sm text-slate-500">
                  แสดงรายชื่อบัญชีที่ลงทะเบียนจากตาราง auth_user_directory เท่านั้น
                </p>
              </div>

              <div class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                ทั้งหมด {{ registeredCustomerRows.length }} บัญชี
              </div>
            </div>

            <div class="mt-4 overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-200 text-left text-slate-500">
                    <th class="px-3 py-3 font-medium">ชื่อลูกค้า</th>
                    <th class="px-3 py-3 font-medium">อีเมล</th>
                    <th class="px-3 py-3 font-medium">User ID</th>
                    <th class="px-3 py-3 font-medium">สิทธิ์</th>
                    <th class="px-3 py-3 font-medium">จำนวนคอร์ส</th>
                    <th class="px-3 py-3 font-medium">ลงทะเบียนเมื่อ</th>
                    <th class="px-3 py-3 font-medium text-right">จัดการสิทธิ์</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="registeredCustomerRows.length === 0">
                    <td colspan="7" class="px-3 py-6 text-center text-slate-500">
                      ยังไม่พบบัญชีลูกค้าในระบบ
                    </td>
                  </tr>

                  <tr
                    v-for="customer in registeredCustomerRows"
                    :key="customer.userId"
                    class="border-b border-slate-100 align-top"
                  >
                    <td class="px-3 py-3">
                      <div class="font-semibold text-slate-900">{{ customer.label }}</div>
                      <div v-if="customer.courseTitles.length" class="mt-1 text-xs text-slate-500">
                        {{ customer.courseTitles.join(", ") }}
                      </div>
                    </td>
                    <td class="px-3 py-3 text-slate-600">{{ customer.email || "-" }}</td>
                    <td class="px-3 py-3 text-xs text-slate-400">{{ customer.userId }}</td>
                    <td class="px-3 py-3">
                      <div
                        class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                        :class="getLevelBadgeClass(customer.levelCode)"
                      >
                        {{ customer.levelName }}
                      </div>
                    </td>
                    <td class="px-3 py-3 text-slate-700">{{ customer.courseCount }}</td>
                    <td class="px-3 py-3 text-slate-500">{{ formatDateTime(customer.registeredAt) }}</td>
                    <td class="px-3 py-3">
                      <div class="flex min-w-[220px] items-center justify-end gap-2">
                        <select
                          v-model="levelDrafts[customer.userId]"
                          class="h-10 min-w-[130px] rounded-xl border border-slate-300 px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                        >
                          <option value="">เลือกระดับสิทธิ์</option>
                          <option v-for="level in customerLevels" :key="level.id" :value="level.id">
                            {{ level.name }}
                          </option>
                        </select>

                        <button
                          type="button"
                          class="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          :disabled="savingLevelUserId === customer.userId || !levelDrafts[customer.userId]"
                          @click="saveCustomerLevel(customer.userId)"
                        >
                          {{ savingLevelUserId === customer.userId ? "กำลังบันทึก..." : "บันทึก" }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">เลือกลูกค้าจาก auth_user_directory</span>
              <select
                v-model="accessForm.selectedUserId"
                class="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              >
                <option value="">เลือกลูกค้า</option>
                <option v-for="customer in registeredCustomerOptions" :key="customer.userId" :value="customer.userId">
                  {{ customer.label }}
                </option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">หรือกรอก User ID เอง</span>
              <input
                v-model.trim="accessForm.manualUserId"
                type="text"
                class="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="UUID ของลูกค้า"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">คอร์สที่อนุญาต</span>
              <select
                v-model="accessForm.courseId"
                class="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              >
                <option value="">เลือกคอร์ส</option>
                <option v-for="course in courses" :key="course.id" :value="course.id">
                  {{ course.title }}
                </option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">วันที่ให้สิทธิ์</span>
              <input
                v-model="accessForm.purchasedAt"
                type="datetime-local"
                class="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </label>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="savingAccess"
              @click="grantAccess"
            >
              {{ savingAccess ? "กำลังบันทึก..." : "เพิ่มสิทธิ์ให้ลูกค้า" }}
            </button>

            <div class="text-xs text-slate-500">
              เลือกลูกค้าจากบัญชีที่ลงทะเบียนแล้ว หรือกรอก `user_id` เองถ้าต้องการ
            </div>
          </div>

          <div class="mt-6 overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-left text-slate-500">
                  <th class="px-3 py-3 font-medium">ลูกค้า</th>
                  <th class="px-3 py-3 font-medium">คอร์ส</th>
                  <th class="px-3 py-3 font-medium">วันที่ให้สิทธิ์</th>
                  <th class="px-3 py-3 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="enrollmentRows.length === 0">
                  <td colspan="4" class="px-3 py-6 text-center text-slate-500">ยังไม่มีลูกค้าที่ได้รับสิทธิ์</td>
                </tr>

                <tr
                  v-for="row in enrollmentRows"
                  :key="row.id"
                  class="border-b border-slate-100 align-top"
                >
                  <td class="px-3 py-3">
                    <div class="font-semibold text-slate-900">{{ getCustomerLabel(row.user_id) }}</div>
                    <div class="mt-1 text-xs text-slate-400">{{ row.user_id }}</div>
                  </td>
                  <td class="px-3 py-3 text-slate-700">{{ row.course?.title || row.course_id }}</td>
                  <td class="px-3 py-3 text-slate-500">{{ formatDateTime(row.purchased_at) }}</td>
                  <td class="px-3 py-3 text-right">
                    <button
                      type="button"
                      class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                      @click="revokeAccess(row.id)"
                    >
                      ถอนสิทธิ์
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="inquiries" class="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-slate-900">ข้อความจากลูกค้า</h2>
              <p class="mt-1 text-sm text-slate-500">
                รายการที่ลูกค้าส่งเข้ามาจากหน้า Contact และ Invoice
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <span class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                ติดต่อเรา {{ inquiryContactCount }}
              </span>
              <span class="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                ใบเสนอราคา {{ inquiryInvoiceCount }}
              </span>
              <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                รวม {{ inquiryRows.length }}
              </span>
            </div>
          </div>

          <div v-if="inquiryLoadError" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {{ inquiryLoadError }}
          </div>

          <div class="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div class="max-h-[620px] overflow-auto">
              <table class="min-w-full table-fixed text-sm">
                <thead class="sticky top-0 z-10 bg-slate-50">
                  <tr class="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th class="w-[130px] px-3 py-3">วันที่เวลา</th>
                    <th class="w-[96px] px-3 py-3">ที่มา</th>
                    <th class="w-[180px] px-3 py-3">ลูกค้า</th>
                    <th class="w-[220px] px-3 py-3">โทร / อีเมล</th>
                    <th class="w-[260px] px-3 py-3">หัวข้อ / บริษัท</th>
                    <th class="min-w-[320px] px-3 py-3">รายละเอียด</th>
                  </tr>
                </thead>

                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr v-if="inquiryRows.length === 0">
                    <td colspan="6" class="px-3 py-10 text-center text-slate-500">ยังไม่มีข้อความจากลูกค้า</td>
                  </tr>

                  <tr
                    v-for="row in inquiryRows"
                    :key="row.key"
                    class="align-top transition hover:bg-slate-50/70"
                  >
                    <td class="px-3 py-3 text-slate-500">
                      {{ formatDateTime(row.created_at) }}
                    </td>

                    <td class="px-3 py-3">
                      <span
                        class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                      :class="row.source_type === 'invoice' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'"
                    >
                        {{ row.source_type === "invoice" ? "ใบเสนอราคา" : "ติดต่อเรา" }}
                    </span>
                  </td>

                    <td class="px-3 py-3 text-slate-800">
                      <div class="font-semibold inquiry-clamp-2" :title="row.customer_name || '-'">
                        {{ row.customer_name || "-" }}
                      </div>
                    </td>

                    <td class="px-3 py-3 text-slate-600">
                      <div class="font-medium text-slate-700">{{ row.phone || "-" }}</div>
                      <div class="mt-1 text-xs text-slate-500 break-all inquiry-clamp-2" :title="row.email || '-'">
                        {{ row.email || "-" }}
                      </div>
                    </td>

                    <td class="px-3 py-3 text-slate-600">
                      <div class="font-medium text-slate-800 inquiry-clamp-2" :title="row.subject || '-'">
                        {{ row.subject || "-" }}
                      </div>
                      <div class="mt-1 text-xs text-slate-500 inquiry-clamp-2" :title="row.company || '-'">
                        {{ row.company || "-" }}
                      </div>
                      <div
                        v-if="row.source_page"
                        class="mt-1 text-[11px] text-slate-400 break-all inquiry-clamp-1"
                        :title="row.source_page"
                      >
                        {{ row.source_page }}
                      </div>
                    </td>

                    <td class="px-3 py-3 text-slate-700">
                      <div class="leading-6 inquiry-clamp-3" :title="row.detail || '-'">
                        {{ shortText(row.detail, 260) || "-" }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="courses" class="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 class="text-lg font-bold text-slate-900">เพิ่มคอร์สใหม่</h2>
            <p class="mt-1 text-sm text-slate-500">เพิ่มคอร์สที่จะนำไปให้สิทธิ์ลูกค้าเข้าดู</p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4">
            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">ชื่อคอร์ส</span>
              <input
                v-model.trim="courseForm.title"
                type="text"
                class="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="เช่น PLC Siemens พื้นฐาน"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">รายละเอียด</span>
              <textarea
                v-model="courseForm.description"
                rows="3"
                class="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="คำอธิบายสั้น ๆ ของคอร์ส"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">Thumbnail URL</span>
              <input
                v-model.trim="courseForm.thumbnail_url"
                type="text"
                class="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="https://..."
              />
            </label>
          </div>

          <div class="mt-4">
            <button
              type="button"
              class="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="savingCourse"
              @click="createCourse"
            >
              {{ savingCourse ? "กำลังเพิ่ม..." : "เพิ่มคอร์ส" }}
            </button>
          </div>
        </section>
      </div>

      <section id="lessons" class="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">คลังคอร์ส</h2>
            <p class="mt-1 text-sm text-slate-500">แก้ไขรายละเอียดคอร์สและเลือกคอร์สที่จะเพิ่มบทเรียนต่อ</p>
          </div>

          <div class="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              v-for="course in courses"
              :key="course.id"
              type="button"
              class="rounded-xl px-3 py-2 text-xs font-semibold transition"
              :class="selectedCourseId === course.id ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              @click="selectedCourseId = course.id"
            >
              {{ course.title }}
            </button>
          </div>
        </div>

        <div v-if="courses.length === 0" class="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          ยังไม่มีคอร์สในระบบ
        </div>

        <div v-else class="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article
            v-for="course in courses"
            :key="course.id"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div class="grid grid-cols-1 gap-4">
              <label class="space-y-2">
                <span class="text-xs font-medium uppercase tracking-wide text-slate-500">ชื่อคอร์ส</span>
                <input
                  v-model.trim="course.title"
                  type="text"
                  class="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-medium uppercase tracking-wide text-slate-500">รายละเอียด</span>
                <textarea
                  v-model="course.description"
                  rows="3"
                  class="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label class="space-y-2">
                <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Thumbnail URL</span>
                <input
                  v-model.trim="course.thumbnail_url"
                  type="text"
                  class="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div class="text-xs text-slate-500">
                {{ countLessons(course.id) }} บทเรียน • {{ countEnrollments(course.id) }} ลูกค้า
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  @click="selectedCourseId = course.id"
                >
                  จัดการบทเรียน
                </button>
                <button
                  type="button"
                  class="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  @click="saveCourse(course)"
                >
                  บันทึกคอร์ส
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">จัดการบทเรียน</h2>
            <p class="mt-1 text-sm text-slate-500">
              เลือกคอร์ส แล้วเพิ่มบทเรียนพร้อมลิงก์วิดีโอได้จากตรงนี้
            </p>
          </div>

          <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            {{ selectedCourse?.title || "ยังไม่ได้เลือกคอร์ส" }}
          </div>
        </div>

        <div v-if="selectedCourse" class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 class="text-base font-bold text-slate-900">เพิ่มบทเรียนใหม่</h3>

            <div class="mt-4 grid grid-cols-1 gap-4">
              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">ชื่อบทเรียน</span>
                <input
                  v-model.trim="lessonForm.title"
                  type="text"
                  class="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="เช่น บทที่ 1: แนะนำคอร์ส"
                />
              </label>

              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">Video Path / URL</span>
                <textarea
                  v-model.trim="lessonForm.video_path"
                  rows="4"
                  class="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="ใส่ Supabase path หรือ Google Drive link"
                />
              </label>

              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">ลำดับบทเรียน</span>
                <input
                  v-model.number="lessonForm.sort_order"
                  type="number"
                  min="1"
                  class="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>
            </div>

            <div class="mt-4">
              <button
                type="button"
                class="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="savingLesson"
                @click="createLesson"
              >
                {{ savingLesson ? "กำลังเพิ่ม..." : "เพิ่มบทเรียน" }}
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-left text-slate-500">
                  <th class="px-3 py-3 font-medium">ลำดับ</th>
                  <th class="px-3 py-3 font-medium">ชื่อบทเรียน</th>
                  <th class="px-3 py-3 font-medium">Video Path / URL</th>
                  <th class="px-3 py-3 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="selectedCourseLessons.length === 0">
                  <td colspan="4" class="px-3 py-6 text-center text-slate-500">คอร์สนี้ยังไม่มีบทเรียน</td>
                </tr>

                <tr
                  v-for="lesson in selectedCourseLessons"
                  :key="lesson.id"
                  class="border-b border-slate-100 align-top"
                >
                  <td class="px-3 py-3">
                    <input
                      v-model.number="lesson.sort_order"
                      type="number"
                      min="1"
                      class="h-10 w-20 rounded-xl border border-slate-300 px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </td>
                  <td class="px-3 py-3">
                    <input
                      v-model.trim="lesson.title"
                      type="text"
                      class="h-10 w-full min-w-[220px] rounded-xl border border-slate-300 px-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </td>
                  <td class="px-3 py-3">
                    <textarea
                      v-model.trim="lesson.video_path"
                      rows="3"
                      class="w-full min-w-[320px] rounded-xl border border-slate-300 px-3 py-3 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </td>
                  <td class="px-3 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        @click="saveLesson(lesson)"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        @click="deleteLesson(lesson.id)"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          เพิ่มคอร์สก่อน หรือเลือกคอร์สจากส่วน "คลังคอร์ส"
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth", "admin"] })

type Course = {
  id: string
  title: string
  description: string
  thumbnail_url: string
}

type Lesson = {
  id: string
  course_id: string
  title: string
  video_path: string
  sort_order: number
}

type EnrollmentRow = {
  id: string
  user_id: string
  course_id: string
  purchased_at: string | null
  course: Course | null
}

type ProfileRow = Record<string, any>
type AuthDirectoryUser = {
  userId: string
  email: string
  displayName: string
  createdAt: string | null
  lastSignInAt: string | null
}

type CustomerLevel = {
  id: string
  code: string
  name: string
  priority: number
  is_default: boolean
  can_access_admin: boolean
}

type CustomerLevelMembership = {
  id: string
  user_id: string
  level_id: string
  status: string
  level: CustomerLevel | null
}

type InquiryRow = {
  key: string
  source_type: "contact" | "invoice"
  source_label: string
  customer_name: string
  phone: string
  company: string
  email: string
  subject: string
  detail: string
  source_page: string
  created_at: string | null
}

const { $supabase } = useNuxtApp() as any
const admin = useAdmin()

const loading = ref(true)
const savingAccess = ref(false)
const savingCourse = ref(false)
const savingLesson = ref(false)

const pageErrorMsg = ref("")
const flashMsg = ref("")

const profiles = ref<ProfileRow[]>([])
const directoryUsers = ref<AuthDirectoryUser[]>([])
const courses = ref<Course[]>([])
const lessons = ref<Lesson[]>([])
const enrollmentRows = ref<EnrollmentRow[]>([])
const customerLevels = ref<CustomerLevel[]>([])
const customerLevelMemberships = ref<CustomerLevelMembership[]>([])
const selectedCourseId = ref("")
const savingLevelUserId = ref("")
const levelDrafts = ref<Record<string, string>>({})
const inquiryRows = ref<InquiryRow[]>([])
const inquiryLoadError = ref("")

const accessForm = ref({
  selectedUserId: "",
  manualUserId: "",
  courseId: "",
  purchasedAt: new Date().toISOString().slice(0, 16),
})

const courseForm = ref({
  title: "",
  description: "",
  thumbnail_url: "",
})

const lessonForm = ref({
  title: "",
  video_path: "",
  sort_order: 1,
})

function resetFlash() {
  flashMsg.value = ""
  pageErrorMsg.value = ""
}

function extractGoogleDriveFileId(rawUrl: string) {
  const value = String(rawUrl || "").trim()
  if (!value) return ""
  if (!/^https?:\/\//i.test(value)) return ""

  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (!host.includes("drive.google.com") && !host.includes("docs.google.com")) return ""

    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/i) || url.pathname.match(/\/d\/([^/]+)/i)
    if (pathMatch?.[1]) return String(pathMatch[1]).trim()

    const id = String(url.searchParams.get("id") || "").trim()
    if (id) return id

    return ""
  } catch {
    return ""
  }
}

function normalizeThumbnailUrl(rawUrl: string) {
  const value = String(rawUrl || "").trim()
  if (!value) return ""
  if (value.startsWith("data:image/")) return value
  if (value.startsWith("//")) return `https:${value}`
  if (value.startsWith("/")) return value
  if (/^(\.?\.?\/)?[^?#]+\.(?:png|jpe?g|gif|webp|svg|avif)(?:[?#].*)?$/i.test(value)) return value
  if (!/^https?:\/\//i.test(value)) return ""

  const googleDriveFileId = extractGoogleDriveFileId(value)
  if (googleDriveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(googleDriveFileId)}&sz=w1600`
  }

  try {
    const url = new URL(value)
    if (url.protocol === "http:") url.protocol = "https:"
    return url.toString()
  } catch {
    return value
  }
}

function normalizeCourse(row: any): Course {
  return {
    id: String(row?.id || ""),
    title: String(row?.title || ""),
    description: String(row?.description || ""),
    thumbnail_url: normalizeThumbnailUrl(String(row?.thumbnail_url || "")),
  }
}

function normalizeLesson(row: any): Lesson {
  return {
    id: String(row?.id || ""),
    course_id: String(row?.course_id || ""),
    title: String(row?.title || ""),
    video_path: String(row?.video_path || ""),
    sort_order: Number(row?.sort_order || 1),
  }
}

function normalizeDirectoryUser(row: any): AuthDirectoryUser {
  return {
    userId: String(row?.userId || row?.user_id || row?.id || "").trim(),
    email: String(row?.email || "").trim(),
    displayName: String(row?.displayName || row?.display_name || row?.name || "").trim(),
    createdAt: row?.createdAt || row?.created_at || null,
    lastSignInAt: row?.lastSignInAt || row?.last_sign_in_at || null,
  }
}

function normalizeCustomerLevel(row: any): CustomerLevel {
  return {
    id: String(row?.id || "").trim(),
    code: String(row?.code || "").trim(),
    name: String(row?.name || row?.code || "").trim(),
    priority: Number(row?.priority || 999),
    is_default: Boolean(row?.is_default),
    can_access_admin: Boolean(row?.can_access_admin),
  }
}

function normalizeCustomerLevelMembership(row: any): CustomerLevelMembership {
  return {
    id: String(row?.id || "").trim(),
    user_id: String(row?.user_id || "").trim(),
    level_id: String(row?.level_id || row?.level?.id || "").trim(),
    status: String(row?.status || "active").trim(),
    level: row?.level ? normalizeCustomerLevel(row.level) : null,
  }
}

function normalizeContactInquiry(row: any, index: number): InquiryRow {
  const id = String(row?.id || "").trim() || `contact-${index + 1}`
  return {
    key: `contact-${id}`,
    source_type: "contact",
    source_label: "Contact",
    customer_name: String(row?.full_name || "").trim(),
    phone: String(row?.phone || "").trim(),
    company: String(row?.company || "").trim(),
    email: String(row?.email || "").trim(),
    subject: String(row?.subject || "").trim(),
    detail: String(row?.detail || "").trim(),
    source_page: String(row?.source_page || "").trim(),
    created_at: row?.created_at ? String(row.created_at) : null,
  }
}

function normalizeInvoiceInquiry(row: any, index: number): InquiryRow {
  const id = String(row?.id || "").trim() || `invoice-${index + 1}`
  return {
    key: `invoice-${id}`,
    source_type: "invoice",
    source_label: "Invoice",
    customer_name: String(row?.customer_name || row?.full_name || "").trim(),
    phone: String(row?.phone || "").trim(),
    company: String(row?.company || "").trim(),
    email: String(row?.email || "").trim(),
    subject: "Request Quotation",
    detail: String(row?.details || row?.detail || "").trim(),
    source_page: "/invoice",
    created_at: row?.created_at ? String(row.created_at) : null,
  }
}

function getInquirySortTimestamp(value: string | null) {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getProfileUserId(profile: ProfileRow | null | undefined) {
  const candidates = [profile?.user_id, profile?.id]
  return String(candidates.find(Boolean) || "").trim()
}

function getProfileEmail(profile: ProfileRow | null | undefined) {
  const candidates = [profile?.email, profile?.user_email, profile?.mail]
  return String(candidates.find(Boolean) || "").trim()
}

function getProfileJoinedName(profile: ProfileRow | null | undefined) {
  const firstName = String(
    profile?.first_name ||
      profile?.firstname ||
      profile?.given_name ||
      profile?.customer_first_name ||
      ""
  ).trim()
  const lastName = String(
    profile?.last_name ||
      profile?.lastname ||
      profile?.family_name ||
      profile?.customer_last_name ||
      ""
  ).trim()

  return [firstName, lastName].filter(Boolean).join(" ").trim()
}

function getEmailName(email: string) {
  const normalized = String(email || "").trim()
  if (!normalized.includes("@")) return normalized
  return normalized.split("@")[0].trim()
}

function getProfileLabel(profile: ProfileRow | null | undefined) {
  const candidates = [
    profile?.full_name,
    profile?.display_name,
    profile?.name,
    profile?.username,
    getProfileEmail(profile),
    getProfileUserId(profile),
  ]

  return String(candidates.find(Boolean) || "ลูกค้า").trim()
}

function getPreferredProfileLabel(profile: ProfileRow | null | undefined) {
  const email = getProfileEmail(profile)
  const candidates = [
    getProfileJoinedName(profile),
    profile?.full_name,
    profile?.fullname,
    profile?.display_name,
    profile?.displayName,
    profile?.customer_name,
    profile?.customerName,
    profile?.name,
    profile?.nickname,
    profile?.nick_name,
    profile?.username,
    getEmailName(email),
    email,
    getProfileUserId(profile),
  ]

  return String(candidates.find(Boolean) || "ลูกค้า").trim()
}

const directoryUserMap = computed(() => {
  const map = new Map<string, AuthDirectoryUser>()

  for (const user of directoryUsers.value) {
    if (!user.userId) continue
    map.set(user.userId, user)
  }

  return map
})

const registeredCustomerMap = computed(() => {
  const map = new Map<string, { userId: string; label: string; email: string; createdAt: string | null; lastSignInAt: string | null }>()

  for (const user of directoryUsers.value) {
    if (!user.userId) continue
    map.set(user.userId, {
      userId: user.userId,
      label: user.displayName || getEmailName(user.email) || user.userId,
      email: user.email || "",
      createdAt: user.createdAt || null,
      lastSignInAt: user.lastSignInAt || null,
    })
  }

  return map
})

const registeredCustomerOptions = computed(() =>
  Array.from(registeredCustomerMap.value.values())
    .map((customer) => ({ userId: customer.userId, label: customer.label }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

const customerProfileMap = computed(() => {
  const map = new Map<string, ProfileRow>()

  for (const profile of profiles.value) {
    const userId = getProfileUserId(profile)
    if (!userId) continue
    map.set(userId, profile)
  }

  return map
})

const customerLevelMap = computed(() => {
  const map = new Map<string, CustomerLevel>()

  for (const level of customerLevels.value) {
    if (!level.id) continue
    map.set(level.id, level)
  }

  return map
})

const membershipMap = computed(() => {
  const map = new Map<string, CustomerLevelMembership>()

  for (const membership of customerLevelMemberships.value) {
    if (!membership.user_id) continue
    map.set(membership.user_id, {
      ...membership,
      level: membership.level || customerLevelMap.value.get(membership.level_id) || null,
    })
  }

  return map
})

const defaultCustomerLevel = computed(() =>
  customerLevels.value.find((level) => level.is_default) || customerLevels.value[0] || null
)

const registeredCustomerRows = computed(() =>
  Array.from(registeredCustomerMap.value.values())
    .map((customer) => {
      const userEnrollments = enrollmentRows.value.filter((row) => row.user_id === customer.userId)
      const membership = membershipMap.value.get(customer.userId)
      const currentLevel = membership?.level || defaultCustomerLevel.value || null
      const courseTitles = Array.from(
        new Set(
          userEnrollments
            .map((row) => row.course?.title || row.course_id || "")
            .filter(Boolean)
        )
      )

      return {
        userId: customer.userId,
        label: customer.label,
        email: customer.email || "-",
        registeredAt: customer.createdAt || null,
        lastSignInAt: customer.lastSignInAt || null,
        levelId: membership?.level_id || currentLevel?.id || "",
        levelName: currentLevel?.name || "-",
        levelCode: currentLevel?.code || "",
        membershipStatus: membership?.status || (currentLevel ? "active" : "-"),
        courseCount: courseTitles.length,
        courseTitles,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
)

const selectedCourse = computed(() => courses.value.find((course) => course.id === selectedCourseId.value) || null)

const selectedCourseLessons = computed(() =>
  lessons.value
    .filter((lesson) => lesson.course_id === selectedCourseId.value)
    .sort((a, b) => a.sort_order - b.sort_order)
)

const inquiryContactCount = computed(() => inquiryRows.value.filter((row) => row.source_type === "contact").length)
const inquiryInvoiceCount = computed(() => inquiryRows.value.filter((row) => row.source_type === "invoice").length)

function countLessons(courseId: string) {
  return lessons.value.filter((lesson) => lesson.course_id === courseId).length
}

function countEnrollments(courseId: string) {
  return enrollmentRows.value.filter((row) => row.course_id === courseId).length
}

function getCustomerLabel(userId: string) {
  return (
    registeredCustomerMap.value.get(userId)?.label ||
    customerProfileMap.value.get(userId)?.full_name ||
    customerProfileMap.value.get(userId)?.display_name ||
    getProfileEmail(customerProfileMap.value.get(userId)) ||
    userId
  )
}

function formatDateTime(value: string | null) {
  if (!value) return "-"

  try {
    return new Date(value).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return value
  }
}

function normalizeInlineText(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function shortText(value: string, limit = 200) {
  const normalized = normalizeInlineText(value)
  if (!normalized) return ""
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, Math.max(0, limit - 3))}...`
}

function syncLevelDrafts() {
  const nextDrafts: Record<string, string> = {}

  for (const customer of registeredCustomerRows.value) {
    nextDrafts[customer.userId] = customer.levelId || defaultCustomerLevel.value?.id || ""
  }

  levelDrafts.value = nextDrafts
}

function getLevelBadgeClass(levelCode: string) {
  switch (String(levelCode || "").toLowerCase()) {
    case "admin":
      return "border-red-200 bg-red-50 text-red-700"
    case "vip":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "gold":
      return "border-yellow-200 bg-yellow-50 text-yellow-700"
    case "silver":
      return "border-slate-200 bg-slate-100 text-slate-700"
    default:
      return "border-sky-200 bg-sky-50 text-sky-700"
  }
}

function getResolvedUserId() {
  return String(accessForm.value.manualUserId || accessForm.value.selectedUserId || "").trim()
}

function resetLessonForm() {
  lessonForm.value.title = ""
  lessonForm.value.video_path = ""
  lessonForm.value.sort_order = countLessons(selectedCourseId.value) + 1 || 1
}

watch(
  selectedCourseId,
  () => {
    resetLessonForm()
  },
  { immediate: true }
)

watch([registeredCustomerRows, defaultCustomerLevel], () => {
  syncLevelDrafts()
})

async function loadDirectoryUsers() {
  try {
    const directoryQuery = await $supabase
      .from("auth_user_directory")
      .select("user_id,email,display_name,created_at,last_sign_in_at")
      .order("display_name", { ascending: true })

    if (!directoryQuery.error && Array.isArray(directoryQuery.data) && directoryQuery.data.length > 0) {
      return directoryQuery.data.map(normalizeDirectoryUser)
    }
  } catch {
    // fall back to server endpoint below
  }

  try {
    const { data, error } = await $supabase.auth.getSession()
    if (error) throw error

    const accessToken = String(data?.session?.access_token || "").trim()
    if (!accessToken) return []

    const response = await $fetch<{ users?: any[] }>("/api/admin/users", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return Array.isArray(response?.users) ? response.users.map(normalizeDirectoryUser) : []
  } catch {
    return []
  }
}

async function loadDashboard() {
  loading.value = true
  resetFlash()

  try {
    const allowed = await admin.refreshAdminState(true)
    if (!allowed) {
      pageErrorMsg.value = "หน้านี้สำหรับผู้ดูแลระบบเท่านั้น"
      return
    }

    const [directoryRows, profileResult, courseResult, lessonResult, enrollmentResult, levelResult, membershipResult, contactResult, invoiceResult] = await Promise.all([
      loadDirectoryUsers(),
      $supabase.from("profiles").select("*"),
      $supabase.from("courses").select("id,title,description,thumbnail_url"),
      $supabase
        .from("course_lessons")
        .select("id,course_id,title,video_path,sort_order")
        .order("sort_order", { ascending: true }),
      $supabase
        .from("course_enrollments")
        .select("id,user_id,course_id,purchased_at, course:courses(id,title,description,thumbnail_url)")
        .order("purchased_at", { ascending: false }),
      $supabase
        .from("customer_levels")
        .select("id,code,name,priority,is_default,can_access_admin")
        .order("priority", { ascending: true }),
      $supabase
        .from("customer_level_memberships")
        .select("id,user_id,level_id,status, level:customer_levels(id,code,name,priority,is_default,can_access_admin)")
        .order("created_at", { ascending: false }),
      $supabase.from("contact_message").select("*"),
      $supabase.from("invoice").select("*"),
    ])

    if (courseResult.error) throw courseResult.error
    if (lessonResult.error) throw lessonResult.error
    if (enrollmentResult.error) throw enrollmentResult.error
    if (levelResult.error) throw levelResult.error
    if (membershipResult.error) throw membershipResult.error

    directoryUsers.value = Array.isArray(directoryRows) ? directoryRows : []
    profiles.value = Array.isArray(profileResult.data) ? (profileResult.data as ProfileRow[]) : []
    courses.value = Array.isArray(courseResult.data) ? courseResult.data.map(normalizeCourse) : []
    lessons.value = Array.isArray(lessonResult.data) ? lessonResult.data.map(normalizeLesson) : []
    customerLevels.value = Array.isArray(levelResult.data) ? levelResult.data.map(normalizeCustomerLevel) : []
    customerLevelMemberships.value = Array.isArray(membershipResult.data)
      ? membershipResult.data.map(normalizeCustomerLevelMembership)
      : []
    enrollmentRows.value = Array.isArray(enrollmentResult.data)
      ? (enrollmentResult.data as any[]).map((row) => ({
          id: String(row.id || ""),
          user_id: String(row.user_id || ""),
          course_id: String(row.course_id || ""),
          purchased_at: row.purchased_at || null,
          course: row.course ? normalizeCourse(row.course) : null,
        }))
      : []

    const loadIssues: string[] = []
    const contactRows = Array.isArray(contactResult.data)
      ? contactResult.data.map((row, index) => normalizeContactInquiry(row, index))
      : []
    const invoiceRows = Array.isArray(invoiceResult.data)
      ? invoiceResult.data.map((row, index) => normalizeInvoiceInquiry(row, index))
      : []

    if (contactResult.error) loadIssues.push(`contact_message: ${contactResult.error.message}`)
    if (invoiceResult.error) loadIssues.push(`invoice: ${invoiceResult.error.message}`)

    inquiryRows.value = [...contactRows, ...invoiceRows].sort(
      (a, b) => getInquirySortTimestamp(b.created_at) - getInquirySortTimestamp(a.created_at)
    )
    inquiryLoadError.value = loadIssues.join(" | ")

    if (!courses.value.find((course) => course.id === selectedCourseId.value)) {
      selectedCourseId.value = courses.value[0]?.id || ""
    }

    if (!accessForm.value.courseId && courses.value.length > 0) {
      accessForm.value.courseId = courses.value[0].id
    }

    resetLessonForm()
    syncLevelDrafts()
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "โหลดข้อมูลหลังบ้านไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}

async function grantAccess() {
  resetFlash()
  const userId = getResolvedUserId()

  if (!userId || !accessForm.value.courseId) {
    pageErrorMsg.value = "กรุณาเลือกลูกค้าและคอร์สก่อน"
    return
  }

  if (enrollmentRows.value.some((row) => row.user_id === userId && row.course_id === accessForm.value.courseId)) {
    pageErrorMsg.value = "ลูกค้าคนนี้มีสิทธิ์เข้าดูคอร์สนี้อยู่แล้ว"
    return
  }

  savingAccess.value = true

  try {
    const purchasedAt = accessForm.value.purchasedAt
      ? new Date(accessForm.value.purchasedAt).toISOString()
      : new Date().toISOString()

    const { error } = await $supabase.from("course_enrollments").insert({
      user_id: userId,
      course_id: accessForm.value.courseId,
      purchased_at: purchasedAt,
    })

    if (error) throw error

    flashMsg.value = "เพิ่มสิทธิ์เข้าดูคอร์สเรียบร้อยแล้ว"
    accessForm.value.manualUserId = ""
    accessForm.value.selectedUserId = ""
    await loadDashboard()
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "เพิ่มสิทธิ์ไม่สำเร็จ"
  } finally {
    savingAccess.value = false
  }
}

async function revokeAccess(enrollmentId: string) {
  if (!confirm("ต้องการถอนสิทธิ์รายการนี้หรือไม่?")) return

  resetFlash()

  try {
    const { error } = await $supabase.from("course_enrollments").delete().eq("id", enrollmentId)
    if (error) throw error

    flashMsg.value = "ถอนสิทธิ์เรียบร้อยแล้ว"
    await loadDashboard()
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "ถอนสิทธิ์ไม่สำเร็จ"
  }
}

async function saveCustomerLevel(userId: string) {
  resetFlash()

  const levelId = String(levelDrafts.value[userId] || "").trim()
  if (!userId || !levelId) {
    pageErrorMsg.value = "กรุณาเลือกระดับสิทธิ์ก่อนบันทึก"
    return
  }

  savingLevelUserId.value = userId

  try {
    const assignedBy = String(useAuth().session.value?.user?.id || "").trim() || null
    const { error } = await $supabase.from("customer_level_memberships").upsert(
      {
        user_id: userId,
        level_id: levelId,
        status: "active",
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) throw error

    flashMsg.value = "บันทึกสิทธิ์ลูกค้าเรียบร้อยแล้ว"
    await loadDashboard()
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "บันทึกสิทธิ์ลูกค้าไม่สำเร็จ"
  } finally {
    savingLevelUserId.value = ""
  }
}

async function createCourse() {
  resetFlash()

  if (!courseForm.value.title.trim()) {
    pageErrorMsg.value = "กรุณากรอกชื่อคอร์ส"
    return
  }

  savingCourse.value = true

  try {
    const normalizedThumbnailUrl = normalizeThumbnailUrl(courseForm.value.thumbnail_url)

    const { error } = await $supabase.from("courses").insert({
      title: courseForm.value.title.trim(),
      description: courseForm.value.description.trim() || null,
      thumbnail_url: normalizedThumbnailUrl || null,
    })

    if (error) throw error

    flashMsg.value = "เพิ่มคอร์สเรียบร้อยแล้ว"
    courseForm.value = { title: "", description: "", thumbnail_url: "" }
    await loadDashboard()
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "เพิ่มคอร์สไม่สำเร็จ"
  } finally {
    savingCourse.value = false
  }
}

async function saveCourse(course: Course) {
  resetFlash()

  try {
    const normalizedThumbnailUrl = normalizeThumbnailUrl(course.thumbnail_url)

    const { error } = await $supabase
      .from("courses")
      .update({
        title: course.title.trim(),
        description: course.description.trim() || null,
        thumbnail_url: normalizedThumbnailUrl || null,
      })
      .eq("id", course.id)

    if (error) throw error

    flashMsg.value = `บันทึกคอร์ส "${course.title}" แล้ว`
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "บันทึกคอร์สไม่สำเร็จ"
  }
}

async function createLesson() {
  resetFlash()

  if (!selectedCourseId.value || !lessonForm.value.title.trim()) {
    pageErrorMsg.value = "กรุณาเลือกคอร์สและกรอกชื่อบทเรียน"
    return
  }

  savingLesson.value = true

  try {
    const { error } = await $supabase.from("course_lessons").insert({
      course_id: selectedCourseId.value,
      title: lessonForm.value.title.trim(),
      video_path: lessonForm.value.video_path.trim(),
      sort_order: Number(lessonForm.value.sort_order || 1),
    })

    if (error) throw error

    flashMsg.value = "เพิ่มบทเรียนเรียบร้อยแล้ว"
    resetLessonForm()
    await loadDashboard()
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "เพิ่มบทเรียนไม่สำเร็จ"
  } finally {
    savingLesson.value = false
  }
}

async function saveLesson(lesson: Lesson) {
  resetFlash()

  try {
    const { error } = await $supabase
      .from("course_lessons")
      .update({
        title: lesson.title.trim(),
        video_path: lesson.video_path.trim(),
        sort_order: Number(lesson.sort_order || 1),
      })
      .eq("id", lesson.id)

    if (error) throw error

    flashMsg.value = `บันทึกบทเรียน "${lesson.title}" แล้ว`
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "บันทึกบทเรียนไม่สำเร็จ"
  }
}

async function deleteLesson(lessonId: string) {
  if (!confirm("ต้องการลบบทเรียนนี้หรือไม่?")) return

  resetFlash()

  try {
    const { error } = await $supabase.from("course_lessons").delete().eq("id", lessonId)
    if (error) throw error

    flashMsg.value = "ลบบทเรียนเรียบร้อยแล้ว"
    await loadDashboard()
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "ลบบทเรียนไม่สำเร็จ"
  }
}

onMounted(loadDashboard)
</script>

<style scoped>
.inquiry-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.inquiry-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.inquiry-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>


