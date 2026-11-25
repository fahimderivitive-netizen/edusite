import type { Lang } from '@/lib/i18n/dict';

export type LegalDoc = { title: string; sections: { h: string; p: string }[] };
export type LegalKey = 'terms' | 'privacy' | 'refund';

export const legal: Record<LegalKey, Record<Lang, LegalDoc>> = {
  terms: {
    en: {
      title: 'Terms of Service',
      sections: [
        { h: 'Using Quark of Education', p: 'By creating an account you agree to these terms. Give accurate information and keep your password private.' },
        { h: 'Your account is personal', p: 'Your account is for you alone. Sharing your login, or letting others watch with your account, is not allowed. We limit the number of devices per account and mark videos and PDFs with your identity.' },
        { h: 'Course content', p: 'Videos, notes, PDFs and exams belong to Quark of Education and its instructors. You may use them for your own learning. Do not copy, record, download, resell or share them.' },
        { h: 'Payments', p: 'Paid courses are paid in Bangladeshi Taka (BDT) through SSLCommerz (bKash, Nagad, Rocket and cards). Access starts after we confirm your payment.' },
        { h: 'Conduct', p: 'Be respectful in comments, doubts and support tickets. We may remove content or suspend accounts that break these rules.' },
        { h: 'Changes and contact', p: 'We may update these terms. Continuing to use the site means you accept the updated terms. For questions, open a ticket on the Support page.' },
      ],
    },
    bn: {
      title: 'সেবার শর্তাবলি',
      sections: [
        { h: 'Quark of Education ব্যবহার', p: 'অ্যাকাউন্ট খোলার মাধ্যমে আপনি এই শর্তাবলি মেনে নিচ্ছেন। সঠিক তথ্য দিন এবং পাসওয়ার্ড গোপন রাখুন।' },
        { h: 'অ্যাকাউন্ট ব্যক্তিগত', p: 'আপনার অ্যাকাউন্ট শুধু আপনার জন্য। লগইন শেয়ার করা বা অন্যকে আপনার অ্যাকাউন্টে কোর্স দেখতে দেওয়া নিষেধ। প্রতিটি অ্যাকাউন্টে ডিভাইসের সংখ্যা সীমিত, এবং ভিডিও ও PDF-এ আপনার পরিচয় ওয়াটারমার্ক হিসেবে দেখানো হয়।' },
        { h: 'কোর্সের কনটেন্ট', p: 'ভিডিও, নোট, PDF ও পরীক্ষা Quark of Education ও শিক্ষকদের সম্পত্তি। নিজের পড়ার জন্য ব্যবহার করতে পারবেন। কপি, রেকর্ড, ডাউনলোড, বিক্রি বা শেয়ার করা যাবে না।' },
        { h: 'পেমেন্ট', p: 'পেইড কোর্সের মূল্য বাংলাদেশি টাকায় (BDT) SSLCommerz-এর মাধ্যমে (বিকাশ, নগদ, রকেট ও কার্ড) দিতে হয়। পেমেন্ট নিশ্চিত হওয়ার পরই কোর্সে প্রবেশাধিকার শুরু হয়।' },
        { h: 'আচরণ', p: 'কমেন্ট, ডাউট ও সাপোর্ট টিকেটে ভদ্র আচরণ করুন। নিয়ম ভাঙলে আমরা কনটেন্ট সরিয়ে দিতে বা অ্যাকাউন্ট স্থগিত করতে পারি।' },
        { h: 'পরিবর্তন ও যোগাযোগ', p: 'আমরা এই শর্তাবলি হালনাগাদ করতে পারি; সাইট ব্যবহার চালিয়ে গেলে নতুন শর্ত মেনে নেওয়া হয়েছে ধরা হবে। প্রশ্ন থাকলে সাপোর্ট পাতায় টিকেট খুলুন।' },
      ],
    },
  },
  privacy: {
    en: {
      title: 'Privacy Policy',
      sections: [
        { h: 'What we collect', p: 'Your name, email address, mobile number, course progress, exam answers and scores, comments, doubts, and support tickets.' },
        { h: 'Payments', p: 'Payments are handled by SSLCommerz. We never see or store your card details or your bKash or Nagad PIN. We only keep the transaction reference, amount and status.' },
        { h: 'How we use it', p: 'To run your account and courses, grade exams, answer your questions, prevent account sharing and piracy, and provide support. Your email, ID and mobile number appear as a watermark on videos and PDFs you open.' },
        { h: 'Who processes data', p: 'We use Supabase (database and login), Bunny (video delivery), SSLCommerz (payments) and Vercel (hosting).' },
        { h: 'Your choices', p: 'You can edit your name and mobile number on your Profile page. To delete your account and data, open a ticket on the Support page.' },
        { h: 'Security', p: 'We use encryption in transit, access rules on every database table, and short-lived links for files. No system is perfectly secure.' },
      ],
    },
    bn: {
      title: 'গোপনীয়তা নীতি',
      sections: [
        { h: 'আমরা কী তথ্য নিই', p: 'আপনার নাম, ইমেইল, মোবাইল নম্বর, কোর্সে অগ্রগতি, পরীক্ষার উত্তর ও স্কোর, কমেন্ট, ডাউট এবং সাপোর্ট টিকেট।' },
        { h: 'পেমেন্ট', p: 'পেমেন্ট পরিচালনা করে SSLCommerz। আপনার কার্ডের তথ্য বা বিকাশ-নগদের পিন আমরা কখনো দেখি না বা রাখি না; শুধু লেনদেনের রেফারেন্স, পরিমাণ ও স্ট্যাটাস সংরক্ষণ করি।' },
        { h: 'কীভাবে ব্যবহার করি', p: 'অ্যাকাউন্ট ও কোর্স চালাতে, পরীক্ষা মূল্যায়ন করতে, প্রশ্নের উত্তর দিতে, অ্যাকাউন্ট শেয়ার ও পাইরেসি ঠেকাতে এবং সহায়তা দিতে। আপনি যে ভিডিও বা PDF খোলেন তাতে আপনার ইমেইল, আইডি ও মোবাইল নম্বর ওয়াটারমার্ক হিসেবে দেখা যায়।' },
        { h: 'কারা তথ্য প্রক্রিয়া করে', p: 'আমরা Supabase (ডেটাবেস ও লগইন), Bunny (ভিডিও), SSLCommerz (পেমেন্ট) এবং Vercel (হোস্টিং) ব্যবহার করি।' },
        { h: 'আপনার নিয়ন্ত্রণ', p: 'প্রোফাইল পাতায় নাম ও মোবাইল নম্বর বদলাতে পারবেন। অ্যাকাউন্ট ও তথ্য মুছতে চাইলে সাপোর্ট পাতায় টিকেট খুলুন।' },
        { h: 'নিরাপত্তা', p: 'আমরা এনক্রিপশন, প্রতিটি ডেটাবেস টেবিলে অ্যাক্সেস নিয়ম এবং ফাইলের জন্য স্বল্পমেয়াদি লিংক ব্যবহার করি। কোনো সিস্টেমই শতভাগ নিরাপদ নয়।' },
      ],
    },
  },
  refund: {
    en: {
      title: 'Refund Policy',
      sections: [
        { h: 'Digital courses', p: 'Our courses are digital and access starts immediately after payment.' },
        { h: 'When you can get a refund', p: 'You can ask for a refund within 7 days of purchase if you have watched less than 20% of the course. We also refund you if you were charged but did not get access.' },
        { h: 'How to ask', p: 'Open a ticket on the Support page with your transaction ID and the reason. We reply within 3 working days.' },
        { h: 'How refunds are paid', p: 'Approved refunds go back to the original payment method (bKash, Nagad, Rocket or card). Bank and mobile-money processing can take 7 to 14 days.' },
        { h: 'Not eligible', p: 'No refund after the 7-day window, after most of the course has been watched, or if your account was suspended for sharing or copying content.' },
      ],
    },
    bn: {
      title: 'রিফান্ড নীতি',
      sections: [
        { h: 'ডিজিটাল কোর্স', p: 'আমাদের কোর্স ডিজিটাল এবং পেমেন্টের পরপরই প্রবেশাধিকার শুরু হয়।' },
        { h: 'কখন রিফান্ড পাবেন', p: 'কেনার ৭ দিনের মধ্যে কোর্সের ২০%-এর কম দেখে থাকলে রিফান্ড চাইতে পারবেন। টাকা কাটা গেলেও কোর্সে প্রবেশাধিকার না পেলে রিফান্ড দেওয়া হবে।' },
        { h: 'কীভাবে চাইবেন', p: 'সাপোর্ট পাতায় লেনদেন আইডি ও কারণসহ টিকেট খুলুন। আমরা ৩ কার্যদিবসের মধ্যে উত্তর দেব।' },
        { h: 'রিফান্ড কীভাবে আসবে', p: 'অনুমোদিত রিফান্ড মূল পেমেন্ট মাধ্যমে (বিকাশ, নগদ, রকেট বা কার্ড) ফেরত যায়। ব্যাংক ও মোবাইল ব্যাংকিং প্রক্রিয়ায় ৭ থেকে ১৪ দিন লাগতে পারে।' },
        { h: 'যেসব ক্ষেত্রে রিফান্ড নেই', p: '৭ দিন পার হলে, কোর্সের বড় অংশ দেখা হলে, অথবা কনটেন্ট শেয়ার বা কপির কারণে অ্যাকাউন্ট স্থগিত হলে রিফান্ড দেওয়া হয় না।' },
      ],
    },
  },
};
