import React from 'react';
import { Language } from '../types';
import { translations, teamMembers } from '../data/translations';
import { 
  Users, 
  Phone, 
  MessageSquare
} from 'lucide-react';

interface TeamMembersProps {
  language: Language;
}

export const TeamMembers: React.FC<TeamMembersProps> = ({ language }) => {
  const t = translations[language];

  return (
    <section id="team" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-[#232c86] text-xs font-semibold mb-4 shadow-sm">
            <Users className="w-3.5 h-3.5 text-[#232c86]" />
            <span>{t.team.tag}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.team.title}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600">
            {t.team.subtitle}
          </p>
        </div>

        {/* Team Grid (Apple Liquid Glass Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group"
            >
              {/* Photo & Badge */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                <img
                  src={member.image}
                  alt={language === 'fa' ? member.nameFa : member.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-sm sm:text-base">
                    {language === 'fa' ? member.nameFa : member.nameEn}
                  </h3>
                  <span className="text-xs text-amber-300 font-medium">
                    {language === 'fa' ? member.roleFa : member.roleEn}
                  </span>
                </div>
              </div>

              {/* Details & Experience */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-start">
                <div className="space-y-2">
                  <div className="text-xs text-slate-600 leading-relaxed font-normal">
                    <strong className="text-slate-900 block mb-0.5 font-semibold">
                      {language === 'fa' ? 'سابقه و تجربه:' : 'Experience:'}
                    </strong>
                    {language === 'fa' ? member.experienceFa : member.experienceEn}
                  </div>

                  <div className="text-xs text-slate-500 pt-2.5 border-t border-slate-200/60 font-normal">
                    <strong className="text-[#232c86] block mb-0.5 font-semibold">
                      {language === 'fa' ? 'تخصص کلیدی:' : 'Key Specialty:'}
                    </strong>
                    {language === 'fa' ? member.specialtyFa : member.specialtyEn}
                  </div>
                </div>

                {/* Direct Contact Button */}
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-1.5 text-slate-700 hover:text-[#232c86] font-mono-spec font-semibold glass-pill px-2.5 py-1 rounded-full shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#232c86]" />
                    <span>{member.phone}</span>
                  </a>
                  <a
                    href={`https://wa.me/98${member.phone?.startsWith('0') ? member.phone.slice(1) : member.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors shadow-sm"
                    title={language === 'fa' ? 'گفتگو در واتس‌اپ' : 'Chat on WhatsApp'}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

